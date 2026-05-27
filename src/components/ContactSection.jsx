import { useRef, useEffect } from 'react';
import { createGlowText, disposeGlowText } from '../utils/glowTextUtils';

const contactContent = {
  title: 'Say hello',
  description: 'Whether it\'s work, a collab, or just something you want to share',
};

export default function ContactSection({ font, visible, scene, gridDimensions }) {
  const meshRef = useRef(null);

  useEffect(() => {
    if (visible && !meshRef.current && gridDimensions?.length && scene && font) {
      meshRef.current = createGlowText(scene, gridDimensions[0], contactContent, font);
    } else if (!visible && meshRef.current) {
      disposeGlowText(scene, meshRef.current);
      meshRef.current = null;
    }
  }, [visible, scene, gridDimensions, font]);

  useEffect(() => () => {
    if (meshRef.current && scene) disposeGlowText(scene, meshRef.current);
  }, []);

  return null;
}
