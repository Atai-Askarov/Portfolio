import  { forwardRef, useEffect, useRef } from "react";

import {  applyPlane} from "../utils/planeUtils";
const _skillsData = [
  {
    title: "Languages",
    description: [
      "JavaScript / TypeScript",
      "Java",
      "Python",
      "C#"
    ].join("\n")
  },
  {
    title: "Frameworks",
    description: [
      "React.js",
      "Three.js",
      "SpringBoot",
      "Flask"
    ].join("\n")
  },
  {
    title: "DeveloperTools",
    description: [
      "Git ",
      "Node.js",
      "Jest",
      "Postman",
      "Figma"
    ].join("\n")
  },
  {
    title: "Databases",
    description: [
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis"
    ].join("\n")
  }
];
const SkillsSection = forwardRef(({ font, visible, scene, gridDimensions: gridRect, section }, ref) => {
  const mountRef = useRef(null);
  const planeRef = useRef([]);
  // Create/remove plane when scene or visibility ch
  // anges
  useEffect(() => {
    applyPlane(scene, visible, planeRef, gridRect, _skillsData, font)
  }, [scene, visible]);
  return (
    <div style={{ position: "relative" }}>
      <div
        ref={ref}
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      {visible && (
        <section
          ref={ref}
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            aligndescription: "center",
            color: "#fff",
            scrollSnapAlign: "start",
            position: "relative",
            zIndex: 1,
          }}
        >
        </section>
      )}
    </div>
  );
});
export default SkillsSection