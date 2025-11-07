import * as THREE from 'three';

export function setupClickToWorldPosition(camera, callback) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Horizontal plane at y = 0

  function onClick(event) {
    // Convert screen to normalized device coordinates (NDC)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast from camera through mouse point
    raycaster.setFromCamera(mouse, camera);

    // Intersect with the plane
    const point = new THREE.Vector3();
    const intersection = raycaster.ray.intersectPlane(plane, point);

    if (intersection) {
      callback(point); // Send the world coordinate to the callback
    }
  }

  window.addEventListener('click', onClick);

  // Return a cleanup function in case you want to remove the listener later
  return () => {
    window.removeEventListener('click', onClick);
  };
}
