import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function PrimaryButton({ text, disabled = false, type = "button" }) {
  const { theme } = useTheme();

  const bgColor = "#7a1f2a";
  const hoverColor = "#a02a3d";
  const textColor = "#fff";
  const darkHoverColor = "#8c2b3b";

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
