import { useState, useEffect, useRef } from 'react';
import SpatialGrid from './SpatialGrid';
import { getWindowDimensions, setUpScene } from './utils/environmentUtils';
import Boid from './Boid';
import { animate} from './utils/animationUtils';
import { Sky } from 'three-stdlib';
import { MathUtils, Vector3 } from 'three';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import ProjectsSection from './components/Portfolio';
import SkillsSection from './components/Skills';
import { birdStateManager } from './birdStateManager';
import { foldAction } from './utils/animationUtils';
import AboutSection from './components/AboutSection';
import ScrollDownIndicator from './components/ScrollDownIndicator';
import Sidebar from './components/Sidebar';
import { loadFont } from './utils/fondLoader';

function App() {
  
  const birdNumber = 100;
  const sceneRef = useRef(null);
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  const [grid, setGrid] = useState(null);
  const birdsRef = useRef(null); 
  const [paperGrid, setPaperGrid] = useState(false);
  const [gridDimensions, setGridDimensions] = useState(null);
  const heroSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const projectSectionRef = useRef(null);
  const skillSectionRef = useRef(null);
  const contactSectionRef = useRef(null);
  const [font, setFont] = useState();
  const [activeSection, setActiveSection] = useState(null);
  const activeSectionRef = useRef(null);

  async function handleResumeClick() {

  }

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);
  const createFlock = async (scene, grid, camera, setPaperGrid, setGridDimensions
  ) => {
    try {

      // activeSection will show you which component is currently within the viewport
      // that's important because I want to make custom paper grids for at least a
      const boid = await Boid.create(true, scene); // Create leader boid
      if (grid) {
        const { boids, mixers } = await copyAndAddBoids(boid, scene, grid);
        if (camera) {
          await animate(boids, mixers, camera, setPaperGrid, setGridDimensions, scene);
        }
      }
    } catch (error) {
      console.error('Failed to create boid:', error);
    }
  };

  const copyAndAddBoids = async (leader, scene, grid, count = birdNumber) => {
    const followerPromises = Array.from({ length: count - 1 }, () => Boid.copyBoid(leader));
    const followerBoids = await Promise.all(followerPromises);
    birdsRef.current = [leader, ... followerBoids];
    if (grid) {
      grid.insert(leader);
      followerBoids.forEach(cloneBoid => grid.insert(cloneBoid));
    }

    let mixers = [];
    followerBoids.forEach(follower => {
      if (follower && follower.blenderData?.mesh) {
        mixers.push(follower.mixer);
        scene.scene.add(follower.blenderData.mesh);
      }
    });

    const allBoids = [leader, ...followerBoids];
    const allMixers = [leader.mixer, ...mixers];

    let nearbyMap = new Map();
    if (grid?.getNearbyBoids) {
      allBoids.forEach(boid => {
        const nearby = grid.getNearbyBoids(boid);
        nearbyMap.set(boid, nearby);
      });
    }

    return { boids: nearbyMap, mixers: allMixers };
  };

  function handleResize() {
    setWindowDimensions(getWindowDimensions());
  }
  
function getUniqueRandomIndices(arrayLength, count = 8) {
  const indices = Array.from({ length: arrayLength }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}
   useEffect(() => { 
      const FONT_URL = "../fonts/MorrisRoman-Black.ttf"
      loadFont(FONT_URL).then(font => {
        setFont(font);
      });
    }, []);

  useEffect(() => {
    let { scene } = setUpScene();
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
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [windowDimensions]);
  // ...existing code...

  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionType = entry.target.dataset.section;
          const birdAmount = entry.target.dataset.birdNumber;
          if (entry.isIntersecting) {
            if (activeSectionRef.current !== sectionType) {
              setActiveSection(sectionType);

              birdStateManager.viewPortState = sectionType;
              // Fold and clear previous grid birds before subscribing new ones
              birdStateManager.returnSubscribers().forEach(bird => foldAction(bird));
              birdStateManager.clearSubscribers();
              const shuffled = getUniqueRandomIndices(birdNumber, birdAmount);
              for (let i = 0; i < shuffled.length; i++) {
                const index = shuffled[i];
                const bird = birdsRef.current[index];
                birdStateManager.subscribe(bird);
              }
              birdStateManager.setState("GRID_FORMATION");
              birdStateManager.notifySubscribers();
            }
          } else {
            // If the section leaving view is the active one, clear it to avoid lingering highlight
            if (activeSectionRef.current === sectionType) {
              setActiveSection(null);
            }
            setPaperGrid(false);
            birdStateManager.setState("FLOCKING");
            birdStateManager.notifySubscribers();
            birdStateManager.returnSubscribers().forEach(bird => foldAction(bird));
            birdStateManager.clearSubscribers();
          }
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.7,
      }
    );

    if (projectSectionRef.current) {
      projectSectionRef.current.dataset.section = "PROJECT";
      projectSectionRef.current.dataset.birdNumber = 16
      observer.observe(projectSectionRef.current);
    }
    if (skillSectionRef.current) {
      skillSectionRef.current.dataset.section = "SKILLS";
      skillSectionRef.current.dataset.birdNumber = 16
      observer.observe(skillSectionRef.current);
    }
    if (heroSectionRef.current) {
      heroSectionRef.current.dataset.section = "HERO";
      heroSectionRef.current.dataset.birdNumber = 15
      observer.observe(heroSectionRef.current);
    }
    if (aboutSectionRef.current) {
      aboutSectionRef.current.dataset.section = "ABOUT";
      aboutSectionRef.current.dataset.birdNumber = 12
      observer.observe(aboutSectionRef.current);
    }
    if (contactSectionRef.current) {
      contactSectionRef.current.dataset.section = "CONTACT";
      contactSectionRef.current.dataset.birdNumber = 12
      observer.observe(contactSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (grid && sceneRef.current) {
      createFlock(sceneRef.current, grid, sceneRef.current.camera, setPaperGrid, setGridDimensions, sceneRef.current);
    }
  }, [grid]);

  // NEW: Trigger logic when ProjectsSection enters viewport
  

  return (
    <div style={{ position: "relative", width: "100vw" }}>
      <Sidebar />
      <canvas
        id="myThreeJsCanvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <NavBar activeSection={activeSection} />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          overflowY: "scroll",
          height: "100vh",
          width: "100vw",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
        }}
      >
        
          <section 
            style={{ height: "100vh", scrollSnapAlign: "start" }}>
            <ScrollDownIndicator />
          </section>
        <section 
        id = "hero"
        ref={heroSectionRef}
        style={{ height: "100vh", scrollSnapAlign: "start" }}>
          <HeroSection 
          onCVClick={handleResumeClick} 
          font = {font} 
          visible = {paperGrid && activeSection === "HERO"}
          scene = {sceneRef.current} 
          gridDimensions={gridDimensions}
          section = {activeSection}  />
        </section>

        <section 
        id = "about"
        ref={aboutSectionRef}
        style={{ height: "100vh", scrollSnapAlign: "start" }}>
          <AboutSection 
                        font = {font} 
                        visible = {paperGrid && activeSection === "ABOUT"}
                        scene = {sceneRef.current} 
                        gridDimensions={gridDimensions} 
                        section = {activeSection}
          />
        </section>

        <section
          id = "portfolio"
          ref={projectSectionRef}
          style={{ height: "100vh", scrollSnapAlign: "start" }}
        >
          <ProjectsSection  font = {font} 
                            visible = {paperGrid && activeSection === "PROJECT"}
                            scene = {sceneRef.current} 
                            gridDimensions={gridDimensions}
                            section = {activeSection} />
        </section>

        <section 
        id = "skills"
        ref={skillSectionRef}
        style={{ height: "100vh", scrollSnapAlign: "start" }}>
          <SkillsSection font = {font}
                        visible = {paperGrid && activeSection === "SKILLS"}
                        scene = {sceneRef.current}
                        gridDimensions={gridDimensions}
                        section = {activeSection} />
        </section>

      </div>
    </div>
  );
}

export default App;
