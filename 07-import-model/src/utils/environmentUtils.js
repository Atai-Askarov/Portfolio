import SceneInit from '../lib/SceneInit';
export function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}
export function getInitialPosition(){
  const { width, height } = getWindowDimensions();
    // Choose a random side: 0=left, 1=right, 2=top, 3=bottom, 4=front, 5=back
    const side = Math.floor(Math.random() * 6);
    let x, y, z;
    const margin = 50; // How far outside the screen/scene
    switch (side) {
      case 0: // left
        x = -width / 2 - margin;
        y = Math.random() * height - height / 2;
        z = Math.random() * 200 - 100;
        break;
      case 1: // right
        x = width / 2 + margin;
        y = Math.random() * height - height / 2;
        z = Math.random() * 200 - 100;
        break;
      case 2: // top
        x = Math.random() * width - width / 2;
        y = height / 2 + margin;
        z = Math.random() * 200 - 100;
        break;
      case 3: // bottom
        x = Math.random() * width - width / 2;
        y = -height / 2 - margin;
        z = Math.random() * 200 - 100;
        break;
      case 4: // front
        x = Math.random() * width - width / 2;
        y = Math.random() * height - height / 2;
        z = 200 + margin;
        break;
      case 5: // back
        x = Math.random() * width - width / 2;
        y = Math.random() * height - height / 2;
        z = -200 - margin;
        break;
      default:
        x = Math.random() * 200 - 100;
        y = Math.random() * 200 - 100;
        z = Math.random() * 200 - 100;
    }
    return {position: [x,y,z]}
}
export function setUpScene() {
  // Create canvas element
  const canvas = document.getElementById('myThreeJsCanvas');
  
  if (!canvas) throw new Error('Canvas element not found!');
  canvas.id = 'myThreeJsCanvas';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.display = 'block';
  canvas.style.position = "absolute";
  canvas.style.top = 0;
  canvas.style.left = 0;


  // Initialize Three.js scene
  const test = new SceneInit('myThreeJsCanvas');
  test.initialize();
  test.animate();

  if (test.controls) {
    test.controls.maxDistance = 700; // Allow zooming out further
    test.controls.minDistance = 500; // Prevent zooming in too close
  }

  test.camera.fov = 70; // Wider field of view for a more distant sky effect
  test.camera.updateProjectionMatrix();
  test.camera.position.set(0, 50, 500); // Move camera further back
  test.camera.lookAt(0, -50, 0);

  return {
    canvas: canvas,
    scene: test,
  };
}
