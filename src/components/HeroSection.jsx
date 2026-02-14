import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import musicVideo from "../assets/musicVideo.mp4"; // replace with your soothing video

const HeroSection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleBrowse = () => {
    navigate("/musics"); // link to AI Music Therapy page
  };

  // Music-themed colors
  const overlayBg = theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(200,230,255,0.4)";
  const cardBg = theme === "dark" ? "rgba(30,30,60,0.6)" : "rgba(255,255,255,0.7)";
  const headingColor = theme === "dark" ? "#80e0ff" : "#1f4aa0";
  const textColor = theme === "dark" ? "#c0f2f1" : "#1a1f4a";
  const buttonBg = theme === "dark" ? "#1f4aa0" : "#1f4aa0";
  const buttonHover = theme === "dark" ? "#3f7acc" : "#3f7acc";

  return (
    <section className="relative text-center py-20 px-6 overflow-hidden transition-colors duration-300">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={musicVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      <div
        className="absolute inset-0 backdrop-blur-[2px] transition-colors duration-300"
        style={{ backgroundColor: overlayBg }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div
          className="backdrop-blur-sm p-8 rounded-xl shadow-lg transition-colors duration-300"
          style={{ backgroundColor: cardBg }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-md transition-colors duration-300"
            style={{ color: headingColor }}
          >
            Relax, Focus, and Heal with Music
          </h2>
          <p
            className="mb-6 drop-shadow-sm transition-colors duration-300"
            style={{ color: textColor }}
          >
            Experience AI-curated music tailored to your mood and emotions, helping you unwind, focus, or boost your energy.
          </p>
          <button
            onClick={handleBrowse}
            className="px-6 py-3 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: buttonBg,
              color: "#fff",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = buttonBg)}
          >
            Explore Music
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
