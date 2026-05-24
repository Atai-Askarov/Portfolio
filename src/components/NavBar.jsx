import { useState } from 'react';

export default function NavBar({ activeSection }) {
  const linkBase = { color: '#fff', margin: '0 16px', textDecoration: 'none' };
  const [hover, setHover] = useState(false);
  const isActive = (s) => activeSection === s;
  const linkStyle = (s) =>
    isActive(s)
      ? { ...linkBase, color: '#d9620eff', fontWeight: 600, textDecoration: 'underline' }
      : linkBase;

  const goTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        background: '#222',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        boxSizing: 'border-box',
        zIndex: 12,
      }}
    >
      <div
        style={{ transform: hover ? 'translateX(50px)' : undefined }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <video
          src="/assets/logo1_enhanced.mp4"
          autoPlay
          muted
          playsInline
          style={{ height: '40px', borderRadius: '8px', zIndex: 13 }}
        />
      </div>
      <div>
        <a
          href="#hero"
          onClick={(e) => goTo(e, 'hero')}
          style={linkStyle('HERO')}
          aria-current={isActive('HERO') ? 'page' : undefined}
        >
          Hero
        </a>
        <a
          href="#about"
          onClick={(e) => goTo(e, 'about')}
          style={linkStyle('ABOUT')}
          aria-current={isActive('ABOUT') ? 'page' : undefined}
        >
          About
        </a>
        <a
          href="#contact"
          onClick={(e) => goTo(e, 'contact')}
          style={linkStyle('CONTACT')}
          aria-current={isActive('CONTACT') ? 'page' : undefined}
        >
          Contact
        </a>
        <a
          href="#now"
          onClick={(e) => goTo(e, 'now')}
          style={linkStyle('NOW')}
          aria-current={isActive('NOW') ? 'page' : undefined}
        >
          Now
        </a>
        <a
          href="#gallery"
          onClick={(e) => goTo(e, 'gallery')}
          style={linkStyle('GALLERY')}
          aria-current={isActive('GALLERY') ? 'page' : undefined}
        >
          Gallery
        </a>
      </div>
    </nav>
  );
}
