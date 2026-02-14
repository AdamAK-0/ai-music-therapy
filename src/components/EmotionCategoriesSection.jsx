import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Calming from "../assets/calmingmusic.jpg";
import StressRelief from "../assets/stressrelief.webp";
import Focus from "../assets/focusmusic.jpeg";
import Uplifting from "../assets/upliftingmusic.jpg";
import Expressive from "../assets/expressivemusic.avif";

const emotions = [
  { name: "Calming", image: Calming},
  { name: "Stress Relief", image: StressRelief },
  { name: "Focus", image: Focus },
  { name: "Uplifting", image: Uplifting},
  { name: "Expressive", image: Expressive},
];


const EmotionCategoriesSection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleEmotionClick = (emotion) => {
    navigate(`/musics?category=${emotion}`);
  };

  // Light/Dark color scheme for music therapy
  const sectionBg = theme === "dark" ? "#0F1220" : "#F5F7FB";
  const sectionText = theme === "dark" ? "#EAEAF0" : "#2E2E3A";
  const cardBg = theme === "dark" ? "#1A1E33" : "#FFFFFF";
  const cardHover = theme === "dark" ? "#262A4D" : "#E0F0F5";
  const overlay = theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(91,108,255,0.2)";

  return (
    <section
      className="py-14 px-6 text-center transition-colors duration-300"
      style={{ backgroundColor: sectionBg }}
    >
      <h2
        className="text-2xl font-bold mb-8 transition-colors duration-300"
        style={{ color: sectionText }}
      >
        Choose How You Want to Feel
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {emotions.map((emotion, i) => (
          <div
            key={i}
            onClick={() => handleEmotionClick(emotion.name)}
            className="relative rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
            style={{ backgroundColor: cardBg }}
          >
            <img
              src={emotion.image}
              alt={emotion.name}
              className="w-full h-28 object-cover transition duration-300"
              style={{
                filter: theme === "dark" ? "brightness(85%)" : "brightness(100%)",
              }}
            />

            <div
              className="absolute inset-0 flex items-center justify-center font-semibold text-sm transition-colors duration-300"
              style={{ backgroundColor: overlay, color: "#fff" }}
            >
              {emotion.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EmotionCategoriesSection;
