import { useRef, useEffect } from 'react';
import { createGlowText, disposeGlowText } from '../utils/glowTextUtils';

const items = [
  { title: 'Genetec',        description: 'Developer & Cloud Analyst Intern' },
  { title: 'Half Marathon',  description: 'Sub 2 hours — 2026'               },
  { title: 'East of Eden',   description: 'John Steinbeck'                   },
  { title: 'Tragic Kingdom', description: 'No Doubt'                         },
];

export default function NowSection({ font, visible, scene, gridDimensions }) {
  const meshRefs = useRef([null, null, null, null]);

  useEffect(() => {
    if (visible && gridDimensions?.length >= 4 && scene && font) {
      meshRefs.current = items.map((item, i) => {
        if (meshRefs.current[i]) return meshRefs.current[i];
        return createGlowText(scene, gridDimensions[i], item, font, 'top');
      });
    } else if (!visible) {
      meshRefs.current.forEach((mesh, i) => {
        if (mesh) { disposeGlowText(scene, mesh); meshRefs.current[i] = null; }
      });
    }
  }, [visible, scene, gridDimensions, font]);

  useEffect(() => () => {
    meshRefs.current.forEach((mesh) => {
      if (mesh && scene) disposeGlowText(scene, mesh);
    });
  }, []);

  return null;
}
