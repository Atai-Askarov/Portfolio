import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

import SpatialGrid from './SpatialGrid';
import Boid from './Boid';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import GallerySection, { galleryImages } from './components/GallerySection';
import NowSection from './components/NowSection';
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

  const heroSectionRef    = useRef(null);
  const aboutSectionRef   = useRef(null);
  const contactSectionRef = useRef(null);
  const gallerySectionRef = useRef(null);
  const nowSectionRef     = useRef(null);

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  const [grid, setGrid] = useState(null);
  const [paperGrid, setPaperGrid] = useState(false);
  const [gridDimensions, setGridDimensions] = useState(null);
  const [font, setFont] = useState();
  const [activeSection, setActiveSection] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const setGridDimensionsStable = useCallback((next) => {
    setGridDimensions((prev) => (gridDimensionsShallowEqual(prev, next) ? prev : next));
  }, []);

  const handleGalleryNavigate = useCallback((direction) => {
    setGalleryIndex(prev => (prev + direction + galleryImages.length) % galleryImages.length);
    setPaperGrid(false);
    birdStateManager.returnSubscribers().forEach(bird => foldAction(bird));
    birdStateManager.setState('FLOCKING');
    birdStateManager.clearSubscribers();
    const shuffled = getUniqueRandomIndices(BOID_COUNT, 12);
    for (let i = 0; i < shuffled.length; i++) {
      const bird = birdsRef.current?.[shuffled[i]];
      if (bird) birdStateManager.subscribe(bird);
    }
    birdStateManager.setState('GRID_FORMATION');
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
    const FONT_URL = '../fonts/Lugrasimo-Regular.ttf';
    loadFont(FONT_URL).then(setFont);
  }, []);

  useEffect(() => {
    const { scene } = setUpScene();
    sceneRef.current = scene;
    setGrid(new SpatialGrid(windowDimensions));

    const bgTexture = new THREE.TextureLoader().load('/assets/office_background.avif');
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.scene.background = bgTexture;

    window.addEventListener('resize', handleResize);
    return () => {
      bgTexture.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const sectionConfigs = [
      { ref: heroSectionRef,    section: 'HERO',    birdNumber: 12 },
      { ref: aboutSectionRef,   section: 'ABOUT',   birdNumber: 12 },
      { ref: contactSectionRef, section: 'CONTACT', birdNumber: 12 },
      { ref: gallerySectionRef, section: 'GALLERY', birdNumber: 12 },
      { ref: nowSectionRef,     section: 'NOW',     birdNumber: 16 },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionType = entry.target.dataset.section;
          const birdAmount = parseInt(entry.target.dataset.birdNumber, 10);

          if (entry.isIntersecting) {
            if (activeSectionRef.current !== sectionType) {
              setActiveSection(sectionType);
              birdStateManager.viewPortState = sectionType;
              birdStateManager.returnSubscribers().forEach((bird) => foldAction(bird));
              birdStateManager.clearSubscribers();
              const shuffled = getUniqueRandomIndices(BOID_COUNT, birdAmount);
              for (let i = 0; i < shuffled.length; i++) {
                const bird = birdsRef.current?.[shuffled[i]];
                if (bird) birdStateManager.subscribe(bird);
              }
              birdStateManager.setState('GRID_FORMATION');
            }
          } else if (activeSectionRef.current === sectionType) {
            setActiveSection(null);
            setPaperGrid(false);
            birdStateManager.setState('FLOCKING');
            birdStateManager.returnSubscribers().forEach((bird) => foldAction(bird));
            birdStateManager.clearSubscribers();
          }
        }
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.65 }
    );

    sectionConfigs.forEach(({ ref, section, birdNumber }) => {
      if (ref.current) {
        ref.current.dataset.section = section;
        ref.current.dataset.birdNumber = String(birdNumber);
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (grid && sceneRef.current) {
      const scene = sceneRef.current;
      createFlock(scene, grid, scene.camera, setPaperGrid, setGridDimensionsStable);
    }
  }, [grid, setGridDimensionsStable]);

  const scrollLayerStyle = {
    position: 'relative',
    zIndex: 10,
    overflowY: 'scroll',
    height: '100vh',
    width: '100vw',
    scrollSnapType: 'y mandatory',
    scrollbarWidth: 'none',
  };

  const snapSectionStyle = { height: '100vh', scrollSnapAlign: 'start' };

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

      <NavBar activeSection={activeSection} />

      <div style={scrollLayerStyle}>
        <section style={snapSectionStyle}>
          <ScrollDownIndicator />
        </section>

        <section id="hero" ref={heroSectionRef} style={snapSectionStyle}>
          <HeroSection
            onCVClick={handleResumeClick}
            font={font}
            visible={paperGrid && activeSection === 'HERO'}
            scene={sceneRef.current}
            gridDimensions={gridDimensions}
            section={activeSection}
          />
        </section>

        <section id="about" ref={aboutSectionRef} style={snapSectionStyle}>
          <AboutSection
            font={font}
            visible={paperGrid && activeSection === 'ABOUT'}
            scene={sceneRef.current}
            gridDimensions={gridDimensions}
            section={activeSection}
          />
        </section>

        <section id="contact" ref={contactSectionRef} style={snapSectionStyle}>
          <ContactSection
            font={font}
            visible={paperGrid && activeSection === 'CONTACT'}
            scene={sceneRef.current}
            gridDimensions={gridDimensions}
            section={activeSection}
          />
        </section>

        <section id="now" ref={nowSectionRef} style={snapSectionStyle}>
          <NowSection
            font={font}
            visible={paperGrid && activeSection === 'NOW'}
            scene={sceneRef.current}
            gridDimensions={gridDimensions}
          />
        </section>

        <section id="gallery" ref={gallerySectionRef} style={snapSectionStyle}>
          <GallerySection
            visible={paperGrid && activeSection === 'GALLERY'}
            scene={sceneRef.current}
            gridDimensions={gridDimensions}
            galleryIndex={galleryIndex}
            onNavigate={handleGalleryNavigate}
          />
        </section>

      </div>
    </div>
  );
}

export default App;
