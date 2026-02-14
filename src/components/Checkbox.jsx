import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Checkbox({ checked, onChange }) {
  const { theme } = useTheme();

  // 🎵 MUSIC THEME COLORS
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const accentColor = theme === "dark" ? "#33f0e0" : "#1f2a7a";
  const linkColor = theme === "dark" ? "#9ff5ea" : "#4b5bdc";
  const borderColor = theme === "dark" ? "#555" : "#cfd8ff";


  return (
    <label
      className="flex items-start gap-3 text-sm mb-6 cursor-pointer select-none"
      style={{ color: textColor }}
    >
      <input
        type="checkbox"
        className="
          mt-1
          h-4
          w-4
          rounded
          border
          cursor-pointer
        "
        style={{
          borderColor: borderColor,
          color: linkColor,
          accentColor: linkColor, // for modern browsers to color the checkmark
        }}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <span className="leading-snug">
        I agree to the{" "}
        <a
          href="/privacy"
          className="underline hover:opacity-80"
          style={{ color: linkColor }}
        >
          Terms of Service and Privacy Policy
        </a>
      </span>
    </label>
  );
}
