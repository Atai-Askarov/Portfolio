import React from "react";

const ScrollDownIndicator = () => (
  <div style={{
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 20,
    pointerEvents: "none"
  }}>
    <span style={{
      fontSize: "1.1rem",
      color: "#fff",
      marginBottom: 8,
      textShadow: "0 2px 8px rgba(0,0,0,0.4)"
    }}>
      Scroll down
    </span>
    <div style={{
      width: 24,
      height: 36,
      border: "2px solid #fff",
      borderRadius: 12,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      position: "relative"
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: 6,
        left: "50%",
        transform: "translateX(-50%)",
        animation: "scrollDot 1.2s infinite cubic-bezier(.4,0,.2,1)"
      }} />
      <style>{`
        @keyframes scrollDot {
          0% { top: 6px; opacity: 1; }
          60% { top: 20px; opacity: 1; }
          100% { top: 28px; opacity: 0; }
        }
      `}</style>
    </div>
  </div>
);

export default ScrollDownIndicator;
