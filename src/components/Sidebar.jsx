import React from 'react';

const Sidebar = ({ activeSection }) => {
  const isContact = activeSection === 'CONTACT';

  const sidebarStyle = {
    position: 'fixed',
    left: '2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    zIndex: 100,
    pointerEvents: 'auto',
    background: 'rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: '1.25rem 0.85rem',
    borderRadius: '14px',
    animation: isContact ? 'sidebarPulse 2s ease-in-out 1' : 'none',
  };

  const linkStyle = {
    color: isContact ? '#ffb347' : '#fff',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.6s ease',
  };

  return (
    <>
    <style>{`
      @keyframes sidebarPulse {
        0%, 100% { filter: drop-shadow(0 0 3px rgba(255,179,71,0.4)) drop-shadow(0 0 8px rgba(255,140,30,0.2)); }
        50%       { filter: drop-shadow(0 0 10px rgba(255,179,71,1.0)) drop-shadow(0 0 24px rgba(255,140,30,0.7)); }
      }
    `}</style>
    <div style={sidebarStyle}>
      <a href="mailto:atai.ask@gmail.com" style={linkStyle} title="Email">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </a>

      <a href="https://github.com/Atai-Askarov" target="_blank" rel="noopener noreferrer" style={linkStyle} title="GitHub">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      </a>

      <a href="https://linkedin.com/in/atai-askarov" target="_blank" rel="noopener noreferrer" style={linkStyle} title="LinkedIn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      </a>

      <a href="https://www.strava.com/athletes/" target="_blank" rel="noopener noreferrer" style={linkStyle} title="Strava">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
      </a>

      <a href="/assets/Atai_Askarov_CV.pdf" target="_blank" rel="noopener noreferrer" style={linkStyle} title="Resume">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </a>
    </div>
    </>
  );
};

export default Sidebar;
