import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const MusicGeneratorSection = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Section-specific colors
  const sectionBg = theme === "dark" ? "#1f1f1f" : "#f0f8ff"; // dark gray vs light blue
  const headingColor = theme === "dark" ? "#80e0ff" : "#1f4aa0"; // heading
  const textColor = theme === "dark" ? "#c0f2f1" : "#1a1f4a"; // paragraph
  const buttonBg = theme === "dark" ? "#1f4aa0" : "#1f4aa0"; // button
  const buttonHover = theme === "dark" ? "#3f7acc" : "#3f7acc"; // button hover

  const handleGenerate = () => {
    navigate("/generate-music"); // Leads to AI music generator page
  };

  return (
    <section
      className="py-14 px-6 text-center transition-colors duration-300"
      style={{ backgroundColor: sectionBg }}
    >
      <h2
        className="text-2xl font-bold mb-4 transition-colors duration-300"
        style={{ color: headingColor }}
      >
        Generate Your Personalized Music
      </h2>
      <p
        className="max-w-lg mx-auto transition-colors duration-300"
        style={{ color: textColor }}
      >
        Create AI-curated music tailored to your mood, energy, or focus — instantly and effortlessly.
      </p>
      <button
        onClick={handleGenerate}
        className="inline-block mt-6 px-6 py-3 rounded-full transition-colors duration-300"
        style={{ backgroundColor: buttonBg, color: "#fff", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = buttonBg)}
      >
        Generate Music
      </button>
    </section>
  );
};

export default MusicGeneratorSection;
