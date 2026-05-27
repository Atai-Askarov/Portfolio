import * as THREE from 'three';

const REVEAL_DELAY    = 0.0;
const REVEAL_DURATION = 1.0;

const activePortraits = new Set();

export function updatePortraitState() {
  const t = performance.now() * 0.001;
  for (const mesh of activePortraits) {
    const elapsed = t - mesh.userData.startTime - REVEAL_DELAY;
    mesh.material.uniforms.uReveal.value = Math.min(1.0, Math.max(0.0, elapsed / REVEAL_DURATION));
  }
}

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  uniform sampler2D uTexture;
  uniform float     uReveal;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    if (tex.a < 0.01) discard;

    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

    // ── Stamp ─────────────────────────────────────────────────────────────────
    // Very steep ramp — stamp hits the paper almost instantly, like a
    // printing press. Lower inkDensity threshold = more ink coverage = bolder.
    float stampT    = smoothstep(0.0, 0.05, uReveal);
    float inkDensity = smoothstep(0.15, 0.58, 1.0 - lum) * tex.a;
    vec3  inkColor   = vec3(0.06, 0.05, 0.03); // near-black heavy ink

    float inkAlpha = inkDensity * stampT;

    // ── Color seep ────────────────────────────────────────────────────────────
    // Colors bleed back in slowly — stamp impression dominates for a while
    // before life returns.
    float colorT = smoothstep(0.38, 1.0, uReveal);

    // ── Combine ───────────────────────────────────────────────────────────────
    float alpha = mix(inkAlpha, tex.a,    colorT);
    vec3  color = mix(inkColor, tex.rgb,  colorT);

    // Lift shadows on the revealed photo without blowing out highlights
    color = mix(color, pow(max(color, vec3(0.0)), vec3(0.82)), colorT);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createPortraitMesh(scene, grid, imagePath, side = 'right', yOffsetFraction = 0) {
  if (!scene || !grid) return null;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uReveal:  { value: 0.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest:   false,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.renderOrder        = 997;
  mesh.userData.startTime = performance.now() * 0.001;
  mesh.userData.disposed  = false;

  const img = new Image();
  img.onload = () => {
    if (mesh.userData.disposed) return;

    const MAX_PX = 512;
    const scale  = Math.min(1, MAX_PX / Math.max(img.width, img.height));
    const cw = Math.round(img.width  * scale);
    const ch = Math.round(img.height * scale);
    const offscreen = document.createElement('canvas');
    offscreen.width  = cw;
    offscreen.height = ch;
    offscreen.getContext('2d').drawImage(img, 0, 0, cw, ch);

    const texture = new THREE.CanvasTexture(offscreen);
    texture.colorSpace    = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter     = THREE.LinearMipmapLinearFilter;
    texture.anisotropy    = 2;
    material.uniforms.uTexture.value = texture;

    const imgAspect = cw / ch;
    const maxH = yOffsetFraction !== 0
      ? grid.height * 0.55
      : side === 'center' ? grid.height * 0.88 : grid.height * 0.92;
    const maxW = yOffsetFraction !== 0
      ? grid.width  * 0.78
      : side === 'center' ? grid.width  * 0.80 : grid.width  * 0.38;
    let pH = maxH;
    let pW = pH * imgAspect;
    if (pW > maxW) { pW = maxW; pH = pW / imgAspect; }

    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(pW, pH);

    const x = side === 'left'
      ? (grid.cx - grid.width / 2) + pW / 2 + grid.width * 0.02
      : side === 'center'
      ? grid.cx
      : (grid.cx + grid.width / 2) - pW / 2 - grid.width * 0.02;
    const y = grid.cy + grid.height * yOffsetFraction;
    mesh.position.set(x, y, grid.z + 0.5);
  };
  img.src = imagePath;

  scene.scene.add(mesh);
  activePortraits.add(mesh);
  return mesh;
}

export function disposePortrait(scene, mesh) {
  if (!mesh || !scene) return;
  mesh.userData.disposed = true;
  activePortraits.delete(mesh);
  scene.scene.remove(mesh);
  mesh.geometry.dispose();
  if (mesh.material.uniforms.uTexture.value) {
    mesh.material.uniforms.uTexture.value.dispose();
  }
  mesh.material.dispose();
}
