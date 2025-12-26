import React from "react";
import { forwardRef } from "react";

const ContactSection = forwardRef(function ContactSection(props, ref) {
  return (
    <section ref={ref} style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(0,31,63,0.8)",
      color: "#fff",
      scrollSnapAlign: "start"
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Contact</h2>
      <p style={{ fontSize: "1.2rem", marginBottom: 16 }}>
        Feel free to reach out!
      </p>
      <a href="mailto:your.email@example.com" style={{
        color: "#ffb347",
        fontWeight: "bold",
        fontSize: "1.2rem",
        textDecoration: "none"
      }}>
        your.email@example.com
      </a>
      <div style={{ marginTop: 24 }}>
        <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", marginRight: 16 }}>GitHub</a>
        <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>LinkedIn</a>
      </div>
    </section>
  );
});

export default ContactSection;