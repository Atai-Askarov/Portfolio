import { useRef, useEffect } from 'react';
import { createGlowText, disposeGlowText } from '../utils/glowTextUtils';
import { createPortraitMesh, disposePortrait } from '../utils/glowImageUtils';

const items = [
  { title: 'Genetec',        description: 'clocking in at'          },
  { title: 'a sub-2h half marathon', description: 'chasing'         },
  { title: 'East of Eden',   description: 'turning pages on'        },
  { title: 'Tragic Kingdom', description: 'listening to a lot of'   },
];

const nowImages = [
  '/assets/now/genetec.png',
  '/assets/now/half-marathon.png',
  '/assets/now/east-of-eden.jpg',
  '/assets/now/No_Doubt_-_Tragic_Kingdom.png',
];

export default function NowSection({ font, visible, scene, gridDimensions }) {
  const textRefs     = useRef([null, null, null, null]);
  const portraitRefs = useRef([null, null, null, null]);

  useEffect(() => {
    if (visible && gridDimensions?.length >= 4 && scene && font) {
      textRefs.current = items.map((item, i) => {
        if (textRefs.current[i]) return textRefs.current[i];
        return createGlowText(scene, gridDimensions[i], item, font, 'top');
      });
      portraitRefs.current = nowImages.map((imgPath, i) => {
        if (portraitRefs.current[i]) return portraitRefs.current[i];
        return createPortraitMesh(scene, gridDimensions[i], imgPath, 'center', -0.175);
      });
    } else if (!visible) {
      textRefs.current.forEach((mesh, i) => {
        if (mesh) { disposeGlowText(scene, mesh); textRefs.current[i] = null; }
      });
      portraitRefs.current.forEach((mesh, i) => {
        if (mesh) { disposePortrait(scene, mesh); portraitRefs.current[i] = null; }
      });
    }
  }, [visible, scene, gridDimensions, font]);

  useEffect(() => () => {
    textRefs.current.forEach((mesh) => {
      if (mesh && scene) disposeGlowText(scene, mesh);
    });
    portraitRefs.current.forEach((mesh) => {
      if (mesh && scene) disposePortrait(scene, mesh);
    });
  }, []);

  return null;
}
