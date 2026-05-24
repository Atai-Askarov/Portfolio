import * as THREE from 'three';

const REVEAL_DELAY    = 0.0;
const REVEAL_DURATION = 2.2;

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

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createPortraitMesh(scene, grid, imagePath, side = 'right') {
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

  new THREE.TextureLoader().load(imagePath, (texture) => {
    if (mesh.userData.disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    if (scene.renderer?.capabilities) {
      texture.anisotropy = scene.renderer.capabilities.getMaxAnisotropy();
    }
    material.uniforms.uTexture.value = texture;

    const imgAspect = texture.image.width / texture.image.height;
    const maxH = side === 'center' ? grid.height * 0.88 : grid.height * 0.92;
    const maxW = side === 'center' ? grid.width  * 0.80 : grid.width  * 0.38;
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
    mesh.position.set(x, grid.cy, grid.z + 0.5);
  });

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
