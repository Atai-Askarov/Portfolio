import SceneInit from '../lib/SceneInit';

export function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return { width, height };
}

export function getInitialPosition() {
  const { width, height } = getWindowDimensions();
  const side = Math.floor(Math.random() * 6);
  let x;
  let y;
  let z;
  const margin = 50;

  switch (side) {
    case 0:
      x = -width / 2 - margin;
      y = Math.random() * height - height / 2;
      z = Math.random() * 200 - 100;
      break;
    case 1:
      x = width / 2 + margin;
      y = Math.random() * height - height / 2;
      z = Math.random() * 200 - 100;
      break;
    case 2:
      x = Math.random() * width - width / 2;
      y = height / 2 + margin;
      z = Math.random() * 200 - 100;
      break;
    case 3:
      x = Math.random() * width - width / 2;
      y = -height / 2 - margin;
      z = Math.random() * 200 - 100;
      break;
    case 4:
      x = Math.random() * width - width / 2;
      y = Math.random() * height - height / 2;
      z = 200 + margin;
      break;
    case 5:
      x = Math.random() * width - width / 2;
      y = Math.random() * height - height / 2;
      z = -200 - margin;
      break;
    default:
      x = Math.random() * 200 - 100;
      y = Math.random() * 200 - 100;
      z = Math.random() * 200 - 100;
  }

  return { position: [x, y, z] };
}

export function setUpScene() {
  const canvas = document.getElementById('myThreeJsCanvas');
  if (!canvas) throw new Error('Canvas element not found!');

  canvas.id = 'myThreeJsCanvas';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.top = 0;
  canvas.style.left = 0;

  const sceneInit = new SceneInit('myThreeJsCanvas');
  sceneInit.initialize();
  sceneInit.animate();

  if (sceneInit.controls) {
    sceneInit.controls.maxDistance = 700;
    sceneInit.controls.minDistance = 500;
  }

  sceneInit.camera.fov = 70;
  sceneInit.camera.updateProjectionMatrix();
  sceneInit.camera.position.set(0, 50, 500);
  sceneInit.camera.lookAt(0, -50, 0);

  return { canvas, scene: sceneInit };
}
