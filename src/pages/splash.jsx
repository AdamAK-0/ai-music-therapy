import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

const musicLogo = new URL("/ai-music-logo.png", import.meta.url).href;

export default function Splash() {
  const [fade, setFade] = useState("opacity-0");
  const navigate = useNavigate();
  const { theme } = useTheme(); // Use theme

  useEffect(() => {
    const fadeIn = setTimeout(() => setFade("opacity-100"), 100);

    // go to sign-up after 2.5s
    const redirect = setTimeout(() => navigate("/home"), 2500);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(redirect);
    };
  }, [navigate]);

  // Theme-based background
  const bgColor = theme === "dark" ? "#1a1a1a" : "#ffffff";

  return (
    <div
      className="flex items-center justify-center h-screen transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      <img
        src={musicLogo}
        alt="AI Music Logo"
        className={`w-32 h-auto transition-opacity duration-700 ease-in-out ${fade}`}
      />
    </div>
  );
}
