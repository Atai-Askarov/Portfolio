import { useRef, useEffect } from 'react';
import { createPortraitMesh, disposePortrait } from '../utils/glowImageUtils';

const modules = import.meta.globEager('../../assets/gallery/*');
export const galleryImages = Object.values(modules).map((m) => m.default);

const btnStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.45)',
  fontSize: '1.8rem',
  cursor: 'pointer',
  padding: '0 2rem',
  lineHeight: 1,
  transition: 'color 0.2s',
};

export default function GallerySection({ visible, scene, gridDimensions, galleryIndex, onNavigate }) {
  const portraitRef = useRef(null);

  useEffect(() => {
    if (visible && !portraitRef.current && gridDimensions?.length && scene) {
      portraitRef.current = createPortraitMesh(scene, gridDimensions[0], galleryImages[galleryIndex], 'center');
    } else if (!visible && portraitRef.current) {
      disposePortrait(scene, portraitRef.current);
      portraitRef.current = null;
    }
  }, [visible, scene, gridDimensions, galleryIndex]);

  useEffect(() => () => {
    if (portraitRef.current && scene) disposePortrait(scene, portraitRef.current);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onNavigate]);

  // Swipe navigation
  useEffect(() => {
    if (!visible) return;
    let startX = 0;
    const onTouchStart = (e) => { startX = e.touches[0].clientX; };
    const onTouchEnd   = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) onNavigate(dx < 0 ? 1 : -1);
    };
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend',   onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [visible, onNavigate]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      pointerEvents: 'auto',
    }}>
      <button style={btnStyle} onClick={() => onNavigate(-1)}>&#8592;</button>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', letterSpacing: '0.25em' }}>
        {galleryIndex + 1}&nbsp;/&nbsp;{galleryImages.length}
      </span>
      <button style={btnStyle} onClick={() => onNavigate(1)}>&#8594;</button>
    </div>
  );
}
