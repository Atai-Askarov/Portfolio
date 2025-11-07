
import * as THREE from 'three';
let sharedMaterials = {};
let geometry = {};

export function applyPlane(scene, visible, planeRef, gridRect, projects, font, section){
    const root = scene
      
      if (!root) return;
      console.log("1st stage")
      if (visible && planeRef.current.length === 0) {
        for(let i = 0; i < gridRect.length; i++){
          const grid = gridRect[i];
          const title = projects[i].title;
          const text = projects[i].description;
          const image = projects[i].image;
          let plane = createPlane(font,text, title,scene, grid, "Portfolio Section", image, section);
          
          planeRef.current.push(plane);
        }
      }  
      else if (!visible && planeRef.current.length > 0) {
        planeRef.current.forEach((mesh) => {disposePlane(mesh,root)
        });
        disposeSharedResources()
        planeRef.current = [];
      }
      return () => {
    if (planeRef.current.length) {
      planeRef.current.forEach((mesh) => disposePlane(mesh));
      planeRef.current = [];
    }
  };
}
function sharedMaterial(sectionName){
  if(sharedMaterials[sectionName] == null){
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

function sharedGeometry(width, height, sectionName){
  if(geometry[sectionName] == null){
    const commonGeometry = new THREE.PlaneGeometry(width, height);
    geometry[sectionName] = commonGeometry
  }
  return geometry[sectionName];
}

function measure(str,font,fontsize) {
    return font.getAdvanceWidth(str, fontsize);
  }

function LineLength(text, innerW, font, fontsize){
  if (text.length === 0) return 0;
  // FIX: pass fontsize into measure so width is valid
  if (measure(text, font, fontsize) <= innerW) return text.length;
  let buf = "";
  let counter = 0;
  for (const ch of text) {
    buf += ch;
    counter++;
    if (measure(buf, font, fontsize) > innerW && buf.length) {
      return counter - 1;
    }
  }
  // IMPORTANT: return full length if never exceeded
  return text.length;
}
// ...existing code...
function trimIncomplete(substring, rest = "", opts = {}) {
  // opts: { innerW, font, fontSize, epsilon }
  const { innerW, font, fontSize, epsilon = 2 } = opts;

  if (!substring || substring.length === 0) {
    // Legacy-safe: nothing kept; forward the remainder as leftover
    return { kept: "", leftover: (rest || "").trimStart() };
  }

  // Helper: measure width in px (ceil to match canvas pixel grid)
  const measurePx = (s) => Math.ceil(font ? font.getAdvanceWidth(String(s), fontSize) : s.length);

  // If we have measurement context, first ensure the substring fits the usable width.
  if (innerW && font && fontSize) {
    const fits = measurePx(substring) <= innerW + epsilon;
    if (!fits) {
      // Move the entire last word to next line (don’t leave a partial word on this line)
      const lastSpace = substring.lastIndexOf(" ");
      if (lastSpace >= 0) {
        const kept = substring.slice(0, lastSpace).replace(/\s+$/,"");
        const movedWord = substring.slice(lastSpace + 1).trimStart();
        // Push the moved word back to the pool with the remaining text
        return { kept, leftover: (movedWord + " " + (rest || "")).trimStart() };
      }
      // No space inside substring → hard-break fallback
      return { kept: substring, leftover: (rest || "").trimStart() };
    }

    // It fits: greedily pull more words from the remainder if they still fit
    let kept = substring.trimEnd();
    let pool = (rest || "").trimStart();
    while (pool.length > 0) {
      const m = pool.match(/^(\S+)(\s*)([\s\S]*)$/); // nextWord, spaces, remainder
      if (!m) break;
      const nextWord = m[1];
      const candidate = kept ? kept + " " + nextWord : nextWord;
      if (measurePx(candidate) <= innerW + epsilon) {
        kept = candidate;
        pool = m[3]; // consume the word (+ any trailing spaces)
      } else {
        break;
      }
    }
    return { kept, leftover: pool };
  }

  // Fallback (no measurement context): avoid partial word by trimming to last space
  const lastSpace = substring.lastIndexOf(" ");
  if (lastSpace >= 0) {
    return {
      kept: substring.slice(0, lastSpace),
      leftover: substring.slice(lastSpace + 1) + (rest || "")
    };
  }
  return { kept: substring, leftover: (rest || "") };
}
// ...existing code...

function splitLongToken(str, innerW, font, fontSize) {
  if (str == null) return [];
  const paragraphs = String(str).split(/\r?\n/);
  const chunks = [];
  let safetyGlobal = 10000;

  for (const para of paragraphs) {
    if (para.length === 0) { chunks.push(""); continue; } // preserve blank line
    let text = para;
    let safety = 2000;

    while (text.length > 0 && safety-- > 0 && safetyGlobal-- > 0) {
      const chunkSize = LineLength(text, innerW, font, fontSize);
      if (chunkSize == null) { chunks.push(text); break; }
      if (chunkSize === 0) break;

      const substring = text.slice(0, chunkSize);
      
      // Pass remainder + measurement context so trimIncomplete can decide fit and greedily include words
      let { kept, leftover } = trimIncomplete(substring, text.slice(chunkSize), { innerW, font, fontSize, epsilon: 2 });
      if (kept.length === 0) { kept = substring; leftover = text.slice(chunkSize); }

      chunks.push(kept);
      text = leftover; // already includes remainder
      if (text === kept) break; // no-progress guard
    }
  }
  return chunks;
}
// ...existing code...
export function makeTextTexture(font, text, title, grid, image = null, section) {
  // helper to draw one line and advance baseline
  function drawLine(ctx, line, x, baselineY, fontSize, lineHeight) {
    if (line == null) return baselineY;
    const path = font.getPath(String(line), x, baselineY, fontSize);
    path.draw(ctx);
    return baselineY + lineHeight;
  }
  function estimateBaseline(linesCount, lineHeight, canvasHeight, padding, ascent, title_baseline) {
  const blockH = linesCount * lineHeight;
  // usable height inside paddings
  const available = canvasHeight - 2 * padding;

  // if it doesn't fit, start at top padding
  if (blockH >= available) return title_baseline + padding + ascent;

  // center: equal space above and below
  const free = available - blockH;
  return title_baseline + Math.round(padding + ascent + free / 2);
}
   const drawWrapped = (textToDraw, startBaseline, widthProvider, font, fontSize) => {
    let baseline = startBaseline;
    let remaining = String(textToDraw || '');
    let safety = 10000;
    while (remaining.length > 0 && safety-- > 0) {
      const currentWidth = typeof widthProvider === 'function' ? widthProvider(baseline) : widthProvider;
      if (!currentWidth || currentWidth <= 4) break;

      const chunkSize = LineLength(remaining, currentWidth, font, fontSize);
      if (!chunkSize || chunkSize < 0) break;

      const substring = remaining.slice(0, chunkSize);
      const rest = remaining.slice(chunkSize);

      // FIX: pass rest and correct option keys to trimIncomplete
      let { kept, leftover } = trimIncomplete(
        substring,
        rest,
        { innerW: currentWidth, font, fontSize, epsilon: 2 }
      );
      if (kept.length === 0) { kept = substring; leftover = rest; }

      baseline = drawLine(ctx, kept, padding, baseline, fontSize, lineHeight);
      remaining = leftover; // leftover already includes any carried word + remaining text

      if (baseline > canvas.height - padding) break;
    }
    return baseline;
  };

  const scaleFactor = 8
  
  ;
  const canvas = document.createElement('canvas');
  canvas.width = grid.width * scaleFactor;
  canvas.height = grid.height * scaleFactor;
  const ctx = canvas.getContext('2d');
  const padding = 10;
  const innerW = canvas.width - padding * 2;

  let fontSize = 55;
  const lineHeight = fontSize * 1.2;
  const ascent = font.ascender && font.unitsPerEm
    ? (font.ascender * fontSize) / font.unitsPerEm
    : fontSize * 0.8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Other sections: image top-right; title first left-of-image; body left-of-image until surpassing image bottom, then full width
  const texture = new THREE.CanvasTexture(canvas);
  if (image) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = canvas.width / 3;
      const maxH = canvas.height / 3;
      let drawW = img.naturalWidth;
      let drawH = img.naturalHeight;
      const scale = Math.min(maxW / drawW, maxH / drawH, 1);
      drawW = Math.floor(drawW * scale);
      drawH = Math.floor(drawH * scale);

      const imgX = canvas.width - padding - drawW;
      const imgY = padding;
      ctx.drawImage(img, imgX, imgY, drawW, drawH);

      const imageLeft = imgX;
      const imageBottom = imgY + drawH;
      const leftColumnWidth = Math.max(0, imageLeft - padding);

      let baseline = padding + ascent;
      const minUsable = fontSize * 2;

       if (leftColumnWidth < minUsable) {
        baseline = imageBottom + padding + ascent;
        baseline = drawWrapped(title, baseline, innerW, font, fontSize);
        baseline = drawWrapped(text, baseline, innerW, font, fontSize);
      } else {
        baseline = drawWrapped(title, baseline, leftColumnWidth, font, fontSize);
        const widthByBaseline = (y) => (y < imageBottom ? leftColumnWidth : innerW);
        baseline = drawWrapped(text, baseline, widthByBaseline, font, fontSize);
      }

      texture.needsUpdate = true; // FIX: update after async draw completes
    };
    img.onerror = (e) => {
      console.warn('Image failed to load:', image, e);
      // Fallback: draw text only so the card isn’t blank
      let baseline = padding + ascent;
      baseline = drawWrapped(title, baseline, innerW, font, fontSize);
      baseline = drawWrapped(text, baseline, innerW, font, fontSize);
      texture.needsUpdate = true; // FIX: ensure update on failure too
    };
    img.src = image;
  
  } else {
    // No image: full width, title first then body
    const bodyLines = splitLongToken(text, innerW, font, fontSize);
  
    let title_baseline = padding + ascent;
    drawLine(ctx, title, padding, title_baseline, fontSize, lineHeight); // draws the title
    let baseline = estimateBaseline(bodyLines.length,lineHeight, canvas.height, padding,ascent, title_baseline);
    for (const line of bodyLines) {
      baseline = drawLine(ctx, line, padding, baseline, fontSize, lineHeight);
    }
    texture.needsUpdate = true;
  }
  
  return texture;
}

export function disposeSharedResources(sectionName){
  if(geometry[sectionName]){
    geometry[sectionName].dispose()
    geometry[sectionName] = null;
  }

}
export function disposePlane(plane) {
  // Handle both single material and material array
  const materials = Array.isArray(plane.material) ? plane.material : [plane.material];
  materials.forEach(mat => {
    if (mat.map) {
      mat.map.dispose(); // free texture GPU memory
    }
    mat.dispose(); // free material GPU memory
  });

  const parent = plane.parent // CHANGED
  if (parent) parent.remove(plane);
}

export function createPlane(font, text, title, scene, grid, name, image, section) {
  if (!scene) return null;
  const root = scene.scene; // support wrapper or raw THREE.Scene
  const geometry = new THREE.PlaneGeometry(grid.width, grid.height);
  const texture = makeTextTexture(font, text, title,grid,image, section)
  texture.needsUpdate = true
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,        // FIX: valid white (or "#ffffff" or "white")
    side: THREE.DoubleSide,
    transparent: true,      // let texture alpha work
    opacity: 1,
    map: texture,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,   
  });
  material.map = texture;
  
  //console.log("Plane created", name, material.uuid, texture.uuid);
  const plane = new THREE.Mesh(geometry, material);
  plane.name = name;
  plane.renderOrder = 10000;
  
  plane.position.set(grid.cx, grid.cy, grid.z);

  root.add(plane);
  return plane;
}