import React, { forwardRef, useRef, useEffect } from 'react';
import {  applyPlane} from "../utils/planeUtils";
const data = [{
  title: "About me",
  description: `Hi there — I’m Atai Askarov, a Full-Stack Developer and Creative Technologist passionate about building meaningful, interactive digital experiences. My work bridges the gap between engineering and design, blending functionality with emotion to create products that are not only powerful, but also deeply engaging.

I specialize in developing scalable web and mobile applications, architecting efficient back-end systems, and crafting immersive 3D environments that tell a story. Whether it’s a real-time web app, a visually rich front-end, or a cross-platform mobile experience, I focus on bringing ideas to life through elegant code, thoughtful design, and technical precision.

My toolkit spans technologies like React, Node.js, React Native, and WebGL, along with creative tools such as Three.js and Blender. I enjoy working across the entire stack — from designing data models and cloud infrastructure to animating 3D scenes that respond to user interaction.

Above all, I believe technology should inspire curiosity and connection. Explore my portfolio to see how I merge software engineering, visual storytelling, and user-centered design into cohesive, interactive experiences that push creative and technical boundaries.`
}]



const AboutSection = forwardRef(({ font, visible, scene, gridDimensions: gridRect, section }, ref) => {
  const planeRef = useRef([]);
      // Create/remove plane when scene or visibility ch
      // anges
      useEffect(() => {
        applyPlane(scene, visible, planeRef, gridRect, data, font)
      }, [scene, visible]);
  return (
    <div>
      {visible && (
        <section 
          ref={ref} 
          style={{
            zIndex: 10,
            color: "#fff",
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: "100vw",
            height: "100vh"
          }}
        >
        </section>
      )}
    </div>
  );
});

export default AboutSection;
