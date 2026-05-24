import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { birdStateManager } from '../birdStateManager';
import { updateGlowState } from './glowTextUtils';
import { updatePortraitState } from './glowImageUtils';
export function findAnimationByName(animations, name) {
  return animations.find((clip) => clip.name === name);
}
export function getAnimationActionFromClip(mixer, animationClip) {
  return mixer.clipAction(animationClip);
}
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
export function createClone(model) {
  const clonedSceneMesh = SkeletonUtils.clone(model.scene);
  clonedSceneMesh.rotation.y = Math.PI / 8;
  clonedSceneMesh.scale.set(10, 10, 10);
  const animationMixer = new THREE.AnimationMixer(clonedSceneMesh);

  return { mesh: clonedSceneMesh, mixer: animationMixer };
}
 // optional gap between papers
export function getGroupedGridPositions(center, num, offset) {
  const paperSize = 65;
  const gridPositions = [];
  const cx = center.position.x + 30;
  const cy = center.position.y - paperSize / 2;
  const cz = center.position.z - 200;
  const totalWidth = num * paperSize * 2 + offset * (num - 1);
  let startX = cx - totalWidth / 2;

  for (let iteration = 0; iteration < num; iteration++) {
    for (let i = 0; i < 4; i += 2) {
      for (let j = 0; j < 4; j += 2) {
        gridPositions.push(
          new THREE.Vector3(startX + (paperSize / 2) * i, cy + (paperSize / 2) * j, cz)
        );
      }
    }
    startX += paperSize * 2 + offset;
  }

  return gridPositions;
}
export function getGridPositions(center, rows, cols, paperSize = 65, gap = 0.09) {
  const mainGridPositions = [];
  const separateColumnPositions = [];
  const yOffset = 30;
  // Support both Vector3 and Object3D (camera, mesh, etc)
  const cx =  center.position.x;
  const cy =  center.position.y;
  const cz =  center.position.z;
  
  // Calculate main grid dimensions
  const totalWidth = cols * paperSize + (cols - 1) * gap;
  const totalHeight = rows * paperSize + (rows - 1) * gap;
  const startX = cx - totalWidth / 2 + paperSize / 2;
  const startY = cy - totalHeight / 2 + paperSize / 2;

  // Distance between main grid and separate column
  
  // First create the main grid positions
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      mainGridPositions.push(new THREE.Vector3(
        startX + c * (paperSize + gap),
        startY + r * (paperSize + gap) - yOffset,
        cz - 200 // keep z constant (like a wall)
      ));
    }
  }

  return mainGridPositions;
}

export function getSquareGridPositions(center, squareSize = 65, screenWidth = 1920) {
  const squares = [];
  const yOffset = 30;
  const cx = center.position.x;
  const cy = center.position.y;
  const cz = center.position.z - 200; // Same z-depth as other grid

  // Calculate horizontal spacing between squares
  const totalGaps = 3; // space between 4 squares
  const totalSquareWidth = squareSize * 4; // width of all squares
  const availableGapSpace = screenWidth - totalSquareWidth;
  const gap = availableGapSpace / totalGaps;

  // Start from the leftmost position
  const startX = cx - (screenWidth / 2) + (squareSize / 2);

  // Create 4 squares
  for (let s = 0; s < 4; s++) {
    const squareCenter = startX + (s * (squareSize + gap));
    const halfSize = squareSize / 2;

    // Create 4 vertices for each square in clockwise order from top-left
    const squareVertices = [
      new THREE.Vector3(squareCenter - halfSize, cy + halfSize - yOffset, cz),  // Top-left
      new THREE.Vector3(squareCenter + halfSize, cy + halfSize - yOffset, cz),  // Top-right
      new THREE.Vector3(squareCenter + halfSize, cy - halfSize - yOffset, cz),  // Bottom-right
      new THREE.Vector3(squareCenter - halfSize, cy - halfSize - yOffset, cz)   // Bottom-left
    ];

    squares.push(squareVertices);
  }

  return squares;
}

function boundingBoxesForGroupedPositions(camera, groupCount, offset) {
  const positions = getGroupedGridPositions(camera, groupCount, offset);
  const groupSize = 4;
  const groups = [];
  for (let i = 0; i < positions.length; i += groupSize) {
    const subgroup = positions.slice(i, i + groupSize);
    groups.push(getBoundingBoxFromPositions(subgroup));
  }
  return { positions, gridDimensions: groups };
}

export function formPaperGrid(camera, birds, rows = 3, cols = 4, scene = null, viewPortState) {
  let combinedPositions = null;
  let positions = null;
  let gridDimensions = null;

  if (viewPortState) {
    switch (viewPortState) {
      case 'HERO': {
        // Remove the right column by setting separateColumn to false
        const positions = getGridPositions(camera, rows, cols);
        combinedPositions = positions;
        gridDimensions = [getBoundingBoxFromPositions(positions)];
        break;
      }
      case 'ABOUT':
      case 'CONTACT':
      case 'GALLERY': {
        positions = getGridPositions(camera, rows, cols);
        combinedPositions = positions;
        gridDimensions = [getBoundingBoxFromPositions(positions)];
        break;
      }
      case 'NOW': {
        const grouped = boundingBoxesForGroupedPositions(camera, 4, 15);
        positions = grouped.positions;
        combinedPositions = positions;
        gridDimensions = grouped.gridDimensions;
        break;
      }
      case 'PROJECT': {
        const grouped = boundingBoxesForGroupedPositions(camera, 4, 15);
        positions = grouped.positions;
        combinedPositions = positions;
        gridDimensions = grouped.gridDimensions;
        break;
      }
      case 'SKILLS': {
        const grouped = boundingBoxesForGroupedPositions(camera, 4, 20);
        positions = grouped.positions;
        combinedPositions = positions;
        gridDimensions = grouped.gridDimensions;
        break;
      }
      default:
        break;
    }
  }

  if (!combinedPositions?.length) {
    return gridDimensions;
  }

  for (let i = 0; i < combinedPositions.length && i < birds.length; i++) {
    const bird = birds[i];
    bird.blenderData.mesh.rotation.set(0, 0, 0);
    unfoldAction(combinedPositions[i], bird, camera);
    bird.update();
  }
  return gridDimensions;
}
function unfoldAction(target, bird, camera) {
    if (!target && camera) {
      target = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    }
    if (bird) {
      
      const freezeDistance = 1;
      const baseSpeed = 0.8;      // min speed
      const accelFactor = 0.02;   // how fast speed grows with distance
      const maxSpeed = 10;

      const distance = bird.position.distanceTo(target);
      const speed = Math.min(maxSpeed, baseSpeed + distance * accelFactor);
        
      if (distance > freezeDistance) {
        // Move toward target
        const direction = new THREE.Vector3().subVectors(target, bird.position).normalize();
        bird.velocity.copy(direction.multiplyScalar(speed)); // Adjust speed as needed
      } else {
        // Snap to grid position and freeze
        if (bird.blenderData.mesh.position) {
          bird.blenderData.mesh.position.copy(target);
        }
        bird.blenderData.flappingAction.setEffectiveWeight(0);
        bird.blenderData.foldingAction.setEffectiveWeight(1);
        bird.blenderData.mesh.scale.set(20,20,20);
        bird.velocity.set(0, 0, 0);
      }
    }
    
    return bird;
}

export function foldAction(bird){
  bird.blenderData.flappingAction.setEffectiveWeight(1);
  bird.blenderData.foldingAction.setEffectiveWeight(0);

}

/** Squared velocity below this counts as “arrived” (strict === 0 fails on float noise). */
const ARRIVED_VEL_EPS_SQ = 1e-6;

export function animate(birds, mixers, camera, setPaperGrid, setGridDimensions, scene) {
  const clock = new THREE.Clock();

  function render() {
    const delta = clock.getDelta();
    updateGlowState();
    updatePortraitState();

    if (mixers.length > 0) {
      for (let i = 0; i < mixers.length; i++) {
        mixers[i].update(delta);
      }
    }
    const viewPortState = birdStateManager.viewPortState;
    const gridBirdsSet = birdStateManager.returnSubscribers();
    const gridBirds = gridBirdsSet ? Array.from(gridBirdsSet) : [];
    let haveArrived = [];

    if (birdStateManager.currentState === "GRID_FORMATION" && gridBirds.length > 0) {
      // Compute grid only once per frame
      const gridDimensions = formPaperGrid(camera, gridBirds, 3, 4, scene, viewPortState);
      setGridDimensions(gridDimensions);

      for (let i = 0; i < gridBirds.length; i++) {
        const gridBird = gridBirds[i];
        const hasArrived = gridBird.velocity.lengthSq() < ARRIVED_VEL_EPS_SQ;
        haveArrived.push(hasArrived);
      }
      if (haveArrived.every(Boolean)) {
        setPaperGrid(true);
      }
    }

    // Main loop over ALL birds (only once!)
    birds.forEach((surroundingBoids, boid) => {
      switch (boid.state) {
        case "FLOCKING":
          boid.applyFlockingBehavior(surroundingBoids);
          boid.update();
          break;

        case "GRID_FORMATION":
          // Already handled in formPaperGrid – just update
          boid.update();
          break;

        default: // IDLE, RESUME_FETCH, etc.
          unfoldAction(null, boid, camera);
          boid.update();
          break;
      }
    });

    requestAnimationFrame(render);
  }

  render();
}


/**
 * Given an array of THREE.Vector3 centers (e.g., paper centers), compute a bounding box
 * that accounts for each paper's half size. Returns both min-corner (x,y) and center (cx,cy)
 * so you can position centered geometry easily.
 * @param {THREE.Vector3[]} positions - Centers of items
 * @param {number} paperSize - Size of each square item (default 65)
 * @returns {{x:number,y:number,cx:number,cy:number,z:number,width:number,height:number}}
 */
export function getBoundingBoxFromPositions(positions, paperSize = 65) {
  if (!positions || positions.length === 0) {
    return { x: 0, y: 0, cx: 0, cy: 0, z: 0, width: 0, height: 0 };
  }

  const halfSize = paperSize / 2;
  let minX = positions[0].x - halfSize;
  let maxX = positions[0].x + halfSize;
  let minY = positions[0].y - halfSize;
  let maxY = positions[0].y + halfSize;
  const z = positions[0].z;

  for (let i = 1; i < positions.length; i++) {
    const p = positions[i];
    const left = p.x - halfSize;
    const right = p.x + halfSize;
    const top = p.y - halfSize;
    const bottom = p.y + halfSize;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cx = minX + width / 2;
  const cy = minY + height / 2;
  
  return { x: minX, y: minY, cx, cy, z, width, height };
}

