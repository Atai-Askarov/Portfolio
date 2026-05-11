// Hyphenation setup
import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const hyphenator = new Hypher(english);
import * as THREE from 'three';
let sharedMaterials = {};
let geometry = {};

export function applyPlane(scene, visible, planeRef, gridRect, projects, font, section) {
  if (!scene) return;

  if (visible && planeRef.current.length === 0 && gridRect?.length && projects?.length) {
    for (let i = 0; i < gridRect.length; i++) {
      const grid = gridRect[i];
      const item = projects[i] ?? projects[projects.length - 1];
      const plane = createPlane(
        font,
        item.description,
        item.title,
        scene,
        grid,
        'Portfolio Section',
        item.image,
        section,
        i,
        item.tag
      );
      if (plane) planeRef.current.push(plane);
    }
  } else if (!visible && planeRef.current.length > 0) {
    planeRef.current.forEach((mesh) => disposePlane(mesh));
    disposeSharedResources();
    planeRef.current = [];
  }
}

function sharedMaterial(sectionName) {
  if (sharedMaterials[sectionName] == null) {
    const commonMaterials = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
    sharedMaterials[sectionName] = commonMaterials;
  }
  return sharedMaterials[sectionName];
}

function sharedGeometry(width, height, sectionName) {
  if (geometry[sectionName] == null) {
    const commonGeometry = new THREE.PlaneGeometry(width, height);
    geometry[sectionName] = commonGeometry;
  }
  return geometry[sectionName];
}

function measure(str, font, fontSize) {
  return font.getAdvanceWidth(str, fontSize);
}

/**
 * Core word-wrap with syllable hyphenation.
 *
 * Strategy (word-first, syllable-fallback):
 *  1. Build lines by appending whole words until one doesn't fit.
 *  2. When a word doesn't fit and the current line is empty (the word is
 *     wider than the entire column), hyphenate it at a syllable boundary.
 *  3. When a word doesn't fit and the current line is NOT empty, flush the
 *     current line and try the word again on the next line (step 1).
 *  4. Words ≤ 6 chars are never hyphenated.
 *
 * This replaces both LineLength() and trimIncomplete() which were fighting
 * each other and causing mid-character splits.
 */
function wrapText(text, innerW, font, fontSize) {
  if (!text) return [];

  const m = (s) => font.getAdvanceWidth(s, fontSize);
  const lines = [];

  // Split on explicit newlines first
  for (const para of String(text).split(/\r?\n/)) {
    if (para.length === 0) { lines.push(''); continue; }

    const words = para.split(/\s+/).filter(Boolean);
    let current = '';

    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const candidate = current.length === 0 ? word : current + ' ' + word;

      if (m(candidate) <= innerW) {
        // Word fits — keep building the line
        current = candidate;
      } else if (current.length === 0) {
        // Word alone is wider than the column — must hyphenate
        const remainder = hyphenateIntoLines(word, innerW, font, fontSize);
        // All but the last chunk become full lines; the last chunk seeds the next line
        for (let ri = 0; ri < remainder.length - 1; ri++) {
          lines.push(remainder[ri]);
        }
        current = remainder[remainder.length - 1];
      } else {
        // Word doesn't fit — flush current line, retry this word
        lines.push(current);
        current = '';
        wi--; // re-process this word on the fresh line
      }
    }

    if (current.length > 0) lines.push(current);
  }

  return lines;
}

/**
 * Hyphenate a single word that is too wide to fit in innerW on its own.
 * Returns an array of line-fragments (all but the last end with '-').
 * Short words (≤ 6 chars) are returned as-is in a single-element array.
 */
function hyphenateIntoLines(word, innerW, font, fontSize) {
  const m = (s) => font.getAdvanceWidth(s, fontSize);

  if (word.length <= 6 || m(word) <= innerW) return [word];

  const syllables = hyphenator.hyphenate(word);
  const fragments = [];
  let current = '';

  for (let si = 0; si < syllables.length; si++) {
    const syl = syllables[si];
    const isLast = si === syllables.length - 1;
    const test = current + syl;
    const testWithHyphen = isLast ? test : test + '-';

    if (m(testWithHyphen) <= innerW) {
      current = test;
    } else {
      // Flush — but only if current is non-empty and not a single letter
      if (current.length > 1) {
        fragments.push(current + '-');
        current = syl;
      } else {
        // Single-letter prefix — don't break here, absorb into next
        current = test;
      }
    }
  }

  if (current.length > 0) fragments.push(current);
  return fragments.length > 0 ? fragments : [word];
}

export function makeTextTexture(font, text, title, grid, image = null, section, link = null) {
  // Helper: draw text with shadow
  function drawWithShadow(ctx, path, color, shadowColor = 'rgba(0,0,0,0.7)', blur = 10, offsetX = 4, offsetY = 4) {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;
    path.fill = color;
    path.draw(ctx);
    ctx.restore();
  }

  const scaleFactor = 8;
  const canvas = document.createElement('canvas');
  canvas.width = grid.width * scaleFactor;
  canvas.height = grid.height * scaleFactor;
  const ctx = canvas.getContext('2d');

  const padding = 80;
  const innerW = (canvas.width / 2) - padding; // Adjusted width for text on the left half

  const fontSize = 95; // Further reduced font size
  const descFontSize = fontSize * 0.9;
  const lineHeight = fontSize * 1.22;
  const descLineHeight = descFontSize * 1.22;
  const ascent = font.ascender && font.unitsPerEm ? (font.ascender * fontSize) / font.unitsPerEm : fontSize * 0.8;
  const descAscent = font.ascender && font.unitsPerEm ? (font.ascender * descFontSize) / font.unitsPerEm : descFontSize * 0.8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const texture = new THREE.CanvasTexture(canvas);

  const titleLines = title ? wrapText(title, innerW, font, fontSize) : [];
  const descLines = text ? wrapText(text, innerW, font, descFontSize) : [];

  // Vertically center the text block in the left half
  const totalTextHeight = (titleLines.length * lineHeight) + (descLines.length * descLineHeight) + (titleLines.length && descLines.length ? 20 : 0);
  let baseline = (canvas.height - totalTextHeight) / 2 + ascent;

  // Draw title
  for (const line of titleLines) {
    const path = font.getPath(String(line), padding, baseline, fontSize);
    drawWithShadow(ctx, path, '#000000'); // Black color
    baseline += lineHeight;
  }

  if (titleLines.length && descLines.length) baseline += 20;

  baseline = baseline - ascent + descAscent;

  // Draw description
  for (const line of descLines) {
    const path = font.getPath(String(line), padding, baseline, descFontSize);
    drawWithShadow(ctx, path, '#000000'); // Black color
    baseline += descLineHeight;
  }

  const img = new Image();
  img.onload = () => {
    const rightHalfX = canvas.width / 2;
    const imgAspectRatio = img.width / img.height;
    
    let imgHeight = canvas.height;
    let imgWidth = imgHeight * imgAspectRatio;
    let imgX = rightHalfX + (rightHalfX - imgWidth) / 2; // Center in right half
    let imgY = 0;

    // If image is too wide for the right half, fit to width instead
    if (imgWidth > rightHalfX) {
        imgWidth = rightHalfX;
        imgHeight = imgWidth / imgAspectRatio;
        imgX = rightHalfX;
        imgY = (canvas.height - imgHeight) / 2; // Center vertically
    }
    
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    texture.needsUpdate = true;
  };

  if (image) {
    img.src = image;
  }

  texture.needsUpdate = true;
  return { texture, linkArea: null }; // linkArea is null for now
}

export function disposeSharedResources(sectionName) {
  if (geometry[sectionName]) {
    geometry[sectionName].dispose();
    geometry[sectionName] = null;
  }
}

export function disposePlane(plane) {
  const materials = Array.isArray(plane.material) ? plane.material : [plane.material];
  materials.forEach(mat => {
    if (mat.map) mat.map.dispose();
    mat.dispose();
  });
  const parent = plane.parent;
  if (parent) parent.remove(plane);
}

export function createPlane(font, text, title, scene, grid, name, image, section, orderIndex = 0, tag = null) {
  if (!scene) return null;
  const root = scene.scene;
  const geo = new THREE.PlaneGeometry(grid.width, grid.height);
  const { texture, linkArea } = makeTextTexture(font, text, title, grid, image, section, tag);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    map: texture,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const plane = new THREE.Mesh(geo, material);
  plane.name = name;
  plane.renderOrder = 10000 + orderIndex;
  plane.position.set(grid.cx, grid.cy, grid.z);

  if (linkArea && tag) {
    plane.userData.linkArea = linkArea;
    plane.userData.link = tag;
  }

  root.add(plane);
  return plane;
}