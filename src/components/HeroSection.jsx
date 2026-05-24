import { useRef, useEffect } from 'react';
import { createGlowText, disposeGlowText } from '../utils/glowTextUtils';
import { createPortraitMesh, disposePortrait } from '../utils/glowImageUtils';
const avatarUrl = '/assets/avatar.png';

const heroContent = {
  title: "Hello, I'm Atai Askarov.",
  description:
    "Developer and artist. I build digital spaces that are both beautiful and meaningful.",
};

export default function HeroSection({ font, visible, scene, gridDimensions }) {
  const meshRef    = useRef(null);
  const portraitRef = useRef(null);

  useEffect(() => {
    if (visible && !meshRef.current && gridDimensions?.length && scene && font) {
      meshRef.current    = createGlowText(scene, gridDimensions[0], heroContent, font, 'left');
      portraitRef.current = createPortraitMesh(scene, gridDimensions[0], avatarUrl);
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
