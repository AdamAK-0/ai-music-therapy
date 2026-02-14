import React from "react";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/ai-music-logo.png";

const Footer = () => {
  const { theme } = useTheme();

  // Music-themed colors
  const footerBg = theme === "dark" ? "#1a1a2a" : "#e5f0ff"; // dark navy vs light blue
  const footerText = theme === "dark" ? "#a0f2f1" : "#1f2a7a"; // teal/blue
  const borderColor = theme === "dark" ? "#33334d" : "#cce0ff"; // border
  const iconHover = theme === "dark" ? "#5ce0e0" : "#1f4aa0"; // hover icons

  return (
    <footer
      className="text-center py-10 transition-colors duration-300 mt-0 -mb-px"
      style={{
        backgroundColor: footerBg,
        color: footerText,
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      <img
        src={logo}
        alt="AI Music Therapy Logo"
        className="mx-auto w-12 mb-3 transition duration-300"
        style={{ filter: theme === "dark" ? "brightness(85%)" : "brightness(100%)" }}
      />

      <p className="text-sm mb-4" style={{ color: footerText }}>
        © 2026 AI Music Therapy. All rights reserved.
      </p>

      <div className="flex justify-center space-x-4 text-xl sm:text-2xl">
        {["facebook", "instagram", "twitter"].map((platform) => (
          <a
            key={platform}
            href="#"
            className="transition-transform duration-200 hover:scale-110"
            style={{ color: footerText }}
            onMouseEnter={(e) => (e.currentTarget.style.color = iconHover)}
            onMouseLeave={(e) => (e.currentTarget.style.color = footerText)}
          >
            <i className={`fab fa-${platform}`}></i>
          </a>
        ))}
      </div>

      {/* Mobile view adjustment */}
      <style>
        {`
          @media (max-width: 400px) {
            footer .space-x-4 {
              flex-direction: column;
              gap: 8px;
            }
          }
        `}
      </style>
    </footer>
  );
};

export default Footer;
