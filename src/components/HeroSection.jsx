import { useRef, useEffect } from 'react';
import { applyPlane } from '../utils/planeUtils';

const heroStyle = {
  zIndex: 10,
  color: '#fff',
  textShadow: '0 2px 16px rgba(0,0,0,0.5)',
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  width: '100vw',
  height: '100vh',
};

const buttonStyle = {
  marginTop: 32,
  padding: '12px 32px',
  fontSize: '1.2rem',
  borderRadius: '24px',
  border: 'none',
  background: 'linear-gradient(90deg, #ffb347 0%, #ffcc80 100%)',
  color: '#222',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  pointerEvents: 'auto',
  transition: 'background 0.2s',
  position: 'absolute',
  bottom: '15vh',
};

const heroContent = [
  {
    title: "Hello, I'm Atai Askarov.",
    description:
      "I'm a developer and artist driven by a passion for bringing ideas to life. I believe technology can be a powerful canvas for storytelling, and I love creating digital spaces that are both beautiful and meaningful. Welcome to my corner of the internet.",
    image: '/assets/avatar.png',
  },
];

export default function HeroSection({
  font,
  visible,
  scene,
  gridDimensions: gridRect,
  section,
}) {
  const planeRef = useRef([]);

  useEffect(() => {
    applyPlane(scene, visible, planeRef, gridRect, heroContent, font, section);
  }, [scene, visible, gridRect, font, section]);

  return (
    <div>
      {visible && (
        <section style={heroStyle}>
          {/* The content is now rendered on the Three.js plane */}
        </section>
      )}
    </div>
  );
}
