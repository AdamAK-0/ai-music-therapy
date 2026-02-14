import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function PrimaryButton({ text, disabled = false, type = "button" }) {
  const { theme } = useTheme();

// 🎵 MUSIC-AI COLORS
  const bgColor = theme === "dark" ? "#33f0e0" : "#1f2a7a";
  const hoverColor = theme === "dark" ? "#5ff7ec" : "#2f3fdc";
  const textColor = theme === "dark" ? "#0f172a" : "#ffffff";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full rounded-lg text-sm font-semibold py-3 px-4 text-center shadow-md transition`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = theme === "dark" ? darkHoverColor : hoverColor;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = bgColor;
      }}
    >
      {text}
    </button>
  );
}
