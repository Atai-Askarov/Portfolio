import { useState, useEffect, useRef, useCallback } from 'react';
import { MathUtils, Vector3 } from 'three';
import { Sky } from 'three-stdlib';

import SpatialGrid from './SpatialGrid';
import Boid from './Boid';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ScrollDownIndicator from './components/ScrollDownIndicator';
import Sidebar from './components/Sidebar';

import { birdStateManager } from './birdStateManager';
import { animate, foldAction } from './utils/animationUtils';
import { getWindowDimensions, setUpScene } from './utils/environmentUtils';
import { loadFont } from './utils/fontLoader';

const BOID_COUNT = 100;
const GRID_DIM_EPS = 0.75;

function approxSameBoundingBox(a, b, eps = GRID_DIM_EPS) {
  if (!a || !b) return false;
  return (
    Math.abs(a.cx - b.cx) < eps &&
    Math.abs(a.cy - b.cy) < eps &&
    Math.abs((a.z ?? 0) - (b.z ?? 0)) < eps &&
    Math.abs(a.width - b.width) < eps &&
    Math.abs(a.height - b.height) < eps
  );
}

function gridDimensionsShallowEqual(prev, next) {
  if (prev === next) return true;
  if (!prev && !next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (!approxSameBoundingBox(prev[i], next[i])) return false;
  }
  return true;
}

function getUniqueRandomIndices(arrayLength, count = 8) {
  const indices = Array.from({ length: arrayLength }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

function App() {
  const sceneRef = useRef(null);
  const birdsRef = useRef(null);
  const activeSectionRef = useRef(null);

  const heroSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const contactSectionRef = useRef(null);

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  const [grid, setGrid] = useState(null);
  const [paperGrid, setPaperGrid] = useState(false);
  const [gridDimensions, setGridDimensions] = useState(null);
  const [font, setFont] = useState();
  const [activeSection, setActiveSection] = useState(null);

  const setGridDimensionsStable = useCallback((next) => {
    setGridDimensions((prev) => (gridDimensionsShallowEqual(prev, next) ? prev : next));
  }, []);

  async function handleResumeClick() {
    // Hook for resume / CV action (e.g. open PDF or fetch URL).
  }

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const copyAndAddBoids = async (leader, scene, spatialGrid, count = BOID_COUNT) => {
    const followerPromises = Array.from({ length: count - 1 }, () => Boid.copyBoid(leader));
    const followerBoids = await Promise.all(followerPromises);
    birdsRef.current = [leader, ...followerBoids];

    if (spatialGrid) {
      spatialGrid.insert(leader);
      followerBoids.forEach((clone) => spatialGrid.insert(clone));
    }

    const mixers = [];
    followerBoids.forEach((follower) => {
      if (follower?.blenderData?.mesh) {
        mixers.push(follower.mixer);
        scene.scene.add(follower.blenderData.mesh);
      }
    });

    const allBoids = [leader, ...followerBoids];
    const allMixers = [leader.mixer, ...mixers];

    const nearbyMap = new Map();
    if (spatialGrid?.getNearbyBoids) {
      allBoids.forEach((boid) => {
        nearbyMap.set(boid, spatialGrid.getNearbyBoids(boid));
      });
    }

    return { boids: nearbyMap, mixers: allMixers };
  };

  const createFlock = async (scene, spatialGrid, camera, setGridPaper, setDims) => {
    try {
      const leader = await Boid.create(true, scene);
      if (!spatialGrid) return;
      const { boids, mixers } = await copyAndAddBoids(leader, scene, spatialGrid);
      if (camera) {
        await animate(boids, mixers, camera, setGridPaper, setDims, scene);
      }
    } catch (error) {
      console.error('Failed to create flock:', error);
    }
  };

  function handleResize() {
    setWindowDimensions(getWindowDimensions());
  }

  useEffect(() => {
    const FONT_URL = '../fonts/MorrisRoman-Black.ttf';
    loadFont(FONT_URL).then(setFont);
  }, []);

  useEffect(() => {
    const { scene } = setUpScene();
    sceneRef.current = scene;
    setGrid(new SpatialGrid(windowDimensions));

    const sky = new Sky();
    sky.scale.setScalar(450000);
    sky.material.uniforms.turbidity.value = 3.8;
    sky.material.uniforms.rayleigh.value = 1.689;
    sky.material.uniforms.mieCoefficient.value = 0.073;
    sky.material.uniforms.mieDirectionalG.value = 0.803;
    const phi = MathUtils.degToRad(90);
    const theta = MathUtils.degToRad(-151.9);
    const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value.copy(sunPosition);
    if (scene.renderer) {
      scene.renderer.toneMappingExposure = 0.1641;
    }
    scene.scene.add(sky);


    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowDimensions]);

  useEffect(() => {
    if (grid && sceneRef.current) {
      const scene = sceneRef.current;
      createFlock(scene, grid, scene.camera, setPaperGrid, setGridDimensionsStable).then(() => {
        if (birdsRef.current?.length) {
          // Initial grid formation
          birdStateManager.setState('GRID_FORMATION');
          birdStateManager.viewPortState = 'HERO';
          const initialShuffled = getUniqueRandomIndices(BOID_COUNT, 12);
          for (let i = 0; i < initialShuffled.length; i++) {
            const bird = birdsRef.current?.[initialShuffled[i]];
            if (bird) birdStateManager.subscribe(bird);
          }

          // Set up the interval to cycle birds
          const intervalId = setInterval(() => {
            const currentSubscribers = birdStateManager.returnSubscribers();
            currentSubscribers.forEach((bird) => foldAction(bird));
            birdStateManager.clearSubscribers();

            const shuffled = getUniqueRandomIndices(BOID_COUNT, 12);
            for (let i = 0; i < shuffled.length; i++) {
              const bird = birdsRef.current?.[shuffled[i]];
              if (bird) birdStateManager.subscribe(bird);
            }
            birdStateManager.viewPortState = 'HERO';
            birdStateManager.setState('GRID_FORMATION');
          }, 5000);

          // Cleanup on component unmount
          return () => {
            clearInterval(intervalId);
          };
        }
      });
    }
  }, [grid, setGridDimensionsStable]);

  return (
    <div style={{ position: 'relative', width: '100vw' }}>
      <Sidebar />
      <canvas
        id="myThreeJsCanvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      
    </div>
  );
}

export default App;
