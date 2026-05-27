import * as THREE from 'three';

const CANVAS_SCALE    = 6;
const REVEAL_DURATION = 0.8;

export const glowTimeUniform = { value: 0.0 };
const activeMeshes = new Set();

export function updateGlowState() {
  const t = performance.now() * 0.001;
  glowTimeUniform.value = t;
  for (const mesh of activeMeshes) {
    mesh.material.uniforms.uReveal.value = Math.min(
      1.0,
      (t - mesh.userData.glowStartTime) / REVEAL_DURATION
    );
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
  uniform sampler2D uTextMask;
  uniform float     uReveal;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTextMask, vUv);
    if (tex.a < 0.02) discard;

    vec3 black = vec3(0.05, 0.04, 0.05);
    vec3 navy  = vec3(0.106, 0.180, 0.420);
    vec3 color = mix(black, navy, uReveal);

    gl_FragColor = vec4(color, tex.a * uReveal);
  }
`;

// ─── Word wrap ────────────────────────────────────────────────────────────────

function wrapWords(text, maxWidth, font, fontSize) {
  const lines = [];
  for (const para of String(text).split(/\r?\n/)) {
    if (!para.trim()) { lines.push(''); continue; }
    const words = para.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.getAdvanceWidth(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

// ─── Canvas texture ───────────────────────────────────────────────────────────

function buildTextMask(title, description, font, gridWidth, gridHeight, layout = 'full') {
  const cw = Math.round(gridWidth  * CANVAS_SCALE);
  const ch = Math.round(gridHeight * CANVAS_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);
  if (!font) return canvas;

  const padding = 0.06 * cw;
  let xTextStart, innerW;
  if (layout === 'right') {
    xTextStart = cw * 0.42 + padding * 0.5;
    innerW     = cw * 0.58 - padding * 1.5;
  } else if (layout === 'left') {
    xTextStart = padding;
    innerW     = cw * 0.58 - padding * 1.5;
  } else {
    xTextStart = padding;
    innerW     = cw - padding * 2;
  }

  const topReserved = ch * 0.35; // fraction of canvas reserved for text in 'top' layout

  const LINE_SCALE = 1.5;
  const maxH = layout === 'top' ? ch * 0.35 : ch * 0.88;

  let titleSize  = Math.round(0.055 * cw);
  let descSize   = description ? Math.round(titleSize * 0.855) : 0;
  let titleLines = wrapWords(title, innerW, font, titleSize);
  let descLines  = description ? wrapWords(description, innerW, font, descSize) : [];
  let titleLineH = titleSize * LINE_SCALE;
  let descLineH  = descSize  * LINE_SCALE;
  let gap        = description ? descLineH : 0;
  let totalTextH = titleLines.length * titleLineH +
    (description && descLines.length ? gap + descLines.length * descLineH : 0);

  // Scale fonts down proportionally if text overflows the available height
  if (totalTextH > maxH) {
    const scale = maxH / totalTextH;
    titleSize  = Math.round(titleSize * scale);
    descSize   = description ? Math.round(titleSize * 0.855) : 0;
    titleLines = wrapWords(title, innerW, font, titleSize);
    descLines  = description ? wrapWords(description, innerW, font, descSize) : [];
    titleLineH = titleSize * LINE_SCALE;
    descLineH  = descSize  * LINE_SCALE;
    gap        = description ? descLineH : 0;
    totalTextH = titleLines.length * titleLineH +
      (description && descLines.length ? gap + descLines.length * descLineH : 0);
  }

  const titleAsc = (font.ascender / font.unitsPerEm) * titleSize;
  const descAsc  = description ? (font.ascender / font.unitsPerEm) * descSize : 0;

  const blockTop = layout === 'top'
    ? (ch * 0.35 - totalTextH) / 2
    : (ch - totalTextH) / 2;
  const titleY0  = blockTop + titleAsc;
  const descY0   = blockTop + titleLines.length * titleLineH + (description ? gap : 0) + descAsc;

  function drawLines(lines, fontSize, lineH, y0, fillColor) {
    if (!lines.length) return;
    let y = y0;
    for (const line of lines) {
      if (!line) { y += lineH; continue; }
      // 'full' layout centers each line; split layouts left-align for clean ragged-right
      const x = (layout === 'full' || layout === 'top')
        ? xTextStart + Math.max(0, (innerW - font.getAdvanceWidth(line, fontSize)) / 2)
        : xTextStart;
      const path = font.getPath(line, x, y, fontSize);
      path.fill        = fillColor;
      path.stroke      = null;
      path.strokeWidth = 0;
      path.draw(ctx);
      y += lineH;
    }
  }

  if (layout === 'top' && descLines.length) {
    // Label (small) above, main content (big) below
    const labelY0 = blockTop + descAsc;
    const contentY0 = blockTop + descLines.length * descLineH + gap + titleAsc;
    drawLines(descLines, descSize, descLineH, labelY0,   '#5a4a3a');
    drawLines(titleLines, titleSize, titleLineH, contentY0, '#1a0e08');
  } else {
    drawLines(titleLines, titleSize, titleLineH, titleY0, '#1a0e08');
    if (descLines.length)
      drawLines(descLines, descSize, descLineH, descY0, '#2a1a10');
  }

  return canvas;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createGlowText(scene, grid, content, font, layout = 'full') {
  if (!scene || !grid || !font) return null;

  const canvas  = buildTextMask(content.title, content.description ?? null, font, grid.width, grid.height, layout);
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTextMask: { value: texture },
      uReveal:   { value: 0.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest:   false,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
  });

  const geometry = new THREE.PlaneGeometry(grid.width, grid.height);
  const mesh     = new THREE.Mesh(geometry, material);
  mesh.position.set(grid.cx, grid.cy, grid.z + 0.1);
  mesh.renderOrder = 999;
  mesh.userData.glowStartTime = performance.now() * 0.001;

  scene.scene.add(mesh);
  activeMeshes.add(mesh);
  return mesh;
}

export function disposeGlowText(scene, mesh) {
  if (!mesh || !scene) return;
  activeMeshes.delete(mesh);
  scene.scene.remove(mesh);
  mesh.geometry.dispose();
  mesh.material.uniforms.uTextMask.value.dispose();
  mesh.material.dispose();
}
