import { forwardRef, useRef, useEffect } from "react";
import {  applyPlane} from "../utils/planeUtils";
const heroStyle = {
  zIndex: 10,
  color: "#fff",
  textShadow: "0 2px 16px rgba(0,0,0,0.5)",
  pointerEvents: "none", // allows interaction with canvas below
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  width:"100vw",
  height:"100vh"
};

const buttonStyle = {
  marginTop: 32,
  padding: "12px 32px",
  fontSize: "1.2rem",
  borderRadius: "24px",
  border: "none",
  background: "linear-gradient(90deg, #ffb347 0%, #ffcc80 100%)",
  color: "#222",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
  pointerEvents: "auto", // enables button click
  transition: "background 0.2s",
  position: "absolute",
  bottom: "15vh"

};
const data = [{
  title: "Building Experiences That Live Between Code and Imagination.",
  description: "Hi, I'm Atai Askarov — a Full-Stack Developer & Creative Technologist crafting interactive, story-driven web, mobile, and 3D experiences."
}]


const HeroSection = forwardRef(({onCVClick, font, visible, scene, gridDimensions: gridRect, section }, ref) => {
  const planeRef = useRef([]);
    // Create/remove plane when scene or visibility ch
    // anges
    useEffect(() => {
      applyPlane(scene, visible, planeRef, gridRect, data, font)
    }, [scene, visible]);
  return (
    <div>
      {visible && 
        <section
      ref={ref}
      style={{
        ...heroStyle,
         
      }}
    >
      {/* <SmolderingText text = {text} dimensions = {gridDimensions} /> */}
     
      <button
        style={buttonStyle}
        onClick={() => {
          if (typeof onCVClick === "function") {
            onCVClick();
          }
        }}
      >
        View Resume
      </button>
      <img
        src="/assets/avatar.png"
        alt="Avatar"
        style={{
          position: "absolute",
          top: "44vh",
          right: "9vw",
          width: 200,
          height: "auto",
          pointerEvents: "none",
          zIndex: 10,
          margin: 0,
          padding: 0
        }}
      />
    </section>
      }
    </div>
    
  );
});

export default HeroSection;