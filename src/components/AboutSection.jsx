import { useRef, useEffect } from 'react';
import { createGlowText, disposeGlowText } from '../utils/glowTextUtils';
import { createPortraitMesh, disposePortrait } from '../utils/glowImageUtils';
const avatarUrl = '/assets/teeth.png';

const aboutContent = {
  title: 'About me',
  description:
    "Full-Stack Developer and Creative Technologist. React, Node.js, WebGL, Three.js, Blender. I build things that push creative and technical boundaries.",
};

export default function AboutSection({ font, visible, scene, gridDimensions }) {
  const meshRef    = useRef(null);
  const portraitRef = useRef(null);

  useEffect(() => {
    if (visible && !meshRef.current && gridDimensions?.length && scene && font) {
      meshRef.current    = createGlowText(scene, gridDimensions[0], aboutContent, font, 'right');
      portraitRef.current = createPortraitMesh(scene, gridDimensions[0], avatarUrl, 'left');
    } else if (!visible) {
      if (meshRef.current)    { disposeGlowText(scene, meshRef.current);    meshRef.current    = null; }
      if (portraitRef.current) { disposePortrait(scene, portraitRef.current); portraitRef.current = null; }
    }
  }, [visible, scene, gridDimensions, font]);

  useEffect(() => () => {
    if (meshRef.current    && scene) disposeGlowText(scene, meshRef.current);
    if (portraitRef.current && scene) disposePortrait(scene, portraitRef.current);
  }, []);

  return null;
}
