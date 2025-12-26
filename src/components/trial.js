// src/components/ProjectsSection.jsx
import  { forwardRef, useEffect, useRef } from "react";
import { createPlane, disposePlane, disposeSharedResources } from "../utils/planeUtils";

const projects = [
  {
    title: "3D Portfolio Website + Boid Simulation",
    description: "Hundreds of real time, animated origami birds flock together to display the contents of this portfolio website.",
    image: "/assets/preview.jpg",
    link: "https://github.com/yourusername/3d-origami-crane"
  },
  {
    title: "Concordia University Navigation System",
    description: `An interactive map that allows navigation around Concordia campuses indoors, outdoors and in between.`,
    image: "/assets/ConcordiaLogo.png",
    link: "https://github.com/yourusername/3d-origami-crane"
  },
  {
    title: "Full Stack Car Rental Application",
    description: "A robust web platform for booking, managing, and tracking car rentals, featuring real-time availability, secure payments, and user authentication.",
    image: "/assets/preview.jpg",
    link: "https://github.com/yourusername/3d-origami-crane"
  },
  {
    title: "Platform for Group and Private Lessons",
    description: "An interactive scheduling and management system for group and private lessons, supporting real-time bookings, instructor profiles, and secure messaging.",
    image: "/assets/preview.jpg",
    link: "https://github.com/yourusername/3d-origami-crane"
  },
  // Add more projects if needed
];

const ProjectsSection = forwardRef(({ font, visible, scene, gridDimensions: gridRect }, ref) => {
    const planeRef = useRef([]);
    // Create/remove plane when scene or visibility ch
    // anges
    useEffect(() => {
      applyPlane(scene, visible,planeRef, gridRect, projects, font);
    }, [scene, visible]);

  return (
    <div
    style={{position: "relative"}}>
      {visible &&
    (<section
      ref={ref}
      style={{
        height: "100vh",
        padding: "60px 0",
        textAlign: "center",
        position: "absolute",
        left: "8vw",
        
      }}
    >
        <button></button>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 32,
          
        }}
      >
        
      </div>
    </section>)}
    </div>
  );
});

export default ProjectsSection;
