// MusicCard.jsx — Backend Connected Version for AI Music Therapy
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../apiConfig";

const MusicCard = ({ music }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Remove /api from root to load images correctly
  const API_ROOT = API_BASE_URL.replace(/\/api$/, "");

  const buildImageUrl = (imgPath) => {
    if (!imgPath) return "";
    if (imgPath.startsWith("http")) return imgPath;
    return `${API_ROOT}${imgPath}`;
  };

  const handleClick = () => {
    navigate(`/musics/${encodeURIComponent(music.title)}`);
  };

  // Colors for music theme
  const cardBg = theme === "dark" ? "#1f1f2a" : "#e5f0ff"; // dark navy vs light blue
  const titleColor = theme === "dark" ? "#a0f2f1" : "#1f2a7a"; // teal/blue
  const descColor = theme === "dark" ? "#cdebef" : "#4a4a4a";

  // IMAGE LOGIC — main image + extra images
const imageList = [
  music.cover,
  ...(music.images || []),
  ...(music.extraImages || []),
].filter(Boolean);

const mainImage = buildImageUrl(imageList[0]);

return (
  <div
    onClick={handleClick}
    className="rounded-lg shadow transition-all duration-200 cursor-pointer hover:scale-[1.02] group overflow-hidden flex flex-col h-full"
    style={{ backgroundColor: cardBg }}
  >
    {/* IMAGE */}
    {mainImage && (
      <div className="w-full h-40 overflow-hidden">
        <img
          src={mainImage}
          alt={music.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{
            filter: theme === "dark" ? "brightness(85%)" : "brightness(100%)",
          }}
        />
      </div>
    )}

    {/* TEXT */}
    <div className="p-4 flex-grow" style={{ backgroundColor: cardBg }}>
      <h3 className="font-semibold text-lg mb-1" style={{ color: titleColor }}>
        {music.title}
      </h3>

      <p className="text-sm line-clamp-3" style={{ color: descColor }}>
        {music.description || "No description available."}
      </p>

      {/* AUDIO PREVIEW */}
      {music.audioUrl && (
        <audio
          controls
          src={buildImageUrl(music.audioUrl)}
          className="mt-2 w-full outline-none"
        />
      )}
    </div>
  </div>
);
};

export default MusicCard;
