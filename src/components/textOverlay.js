import * as THREE from 'three';
import opentype from 'opentype.js';

// Utility function to add a plane with a canvas texture to a Three.js scene
// Accepts either a SceneInit-like object (with .scene and .camera) or a raw THREE.Scene
export function addTextOverlayPlane(ctx,text, scene, canvas, width = 4, height = 3, x = 0, y = -50, z = 0) {
  if (!scene || !canvas) return null;

  // Support both SceneInit (wrapper) and raw THREE.Scene
  const targetScene = scene.scene ?? scene;

  // Create texture from the provided canvas and ensure it uploads
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Make sure the plane is visible regardless of facing and renders on top
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
  });
  if (ctx && text) {
  // transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontSize = 64;
  const lineHeight = fontSize * 1.2;
  const lines = String(text).split('\n');

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });
}

  const geometry = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(x, y, z);
  plane.renderOrder = 999; // render last
  const scale = 1;
  plane.scale.set(scale,scale,scale);

  // If a camera is available (e.g., SceneInit), face the plane toward it
  if (scene.camera) {
    plane.quaternion.copy(scene.camera.quaternion);
  }

  targetScene.add(plane);
  return plane;
}

// --- Smoldering text (opentype.js) helpers ---

export function loadFont(url) {
  return new Promise((resolve, reject) => {
    opentype.load(url, (err, font) => (err ? reject(err) : resolve(font)));
  });
}

function buildTextPath(ctx, font, text, canvas, options) {
  const { fontSize = 64, lineHeight = 1.2 } = options || {};
  const lines = String(text).split('\n');
  const lh = fontSize * lineHeight;
  const centerX = canvas.width / 2;
  const totalH = lh * (lines.length - 1);
  const startY = canvas.height / 2 - totalH / 2;

  ctx.beginPath();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lh;
    const textWidth = font.getAdvanceWidth(line, fontSize);
    const x = centerX - textWidth / 2;
    const p = font.getPath(line, x, y, fontSize);
    p.draw(ctx);
  }
}

function drawSmolderStroke(ctx, progress) {
  const dashLen = 12000;
  ctx.setLineDash([dashLen, dashLen]);
  ctx.lineDashOffset = (1 - progress) * dashLen;

  // Outer glow
  ctx.save();
  ctx.shadowColor = '#FFAE42';
  ctx.shadowBlur = 25;
  ctx.strokeStyle = '#fff3e0';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();

  // Mid glow
  ctx.save();
  ctx.shadowColor = '#FF4500';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#ffe0b2';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Final ink
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.strokeStyle = '#3e2a1f';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Create a plane and animate smoldering text on its texture
export async function addSmolderingTextPlane({
  scene,
  text,
  width,
  height,
  x = 0,
  y = -50,
  z = 0,
  canvasWidth = 1024,
  canvasHeight = 512,
  fontUrl = './fonts/Lugrasimo-Regular.ttf',
  fontSize = 64,
  lineHeight = 1.2,
  duration = 2500,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const plane = addTextOverlayPlane(null, null, scene, canvas, width, height, x, y, z);
  const texture = plane?.material?.map;

  const font = await loadFont(fontUrl);

  let raf = 0;
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    buildTextPath(ctx, font, text, canvas, { fontSize, lineHeight });
    drawSmolderStroke(ctx, t);
    if (texture) texture.needsUpdate = true;
    if (t < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return { plane, cancel: () => cancelAnimationFrame(raf) };
}