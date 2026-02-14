import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function InputField({ label, type = "text", placeholder, value, onChange }) {
  const { theme } = useTheme();
// 🎵 MUSIC THEME COLORS
  const labelColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const inputBg = theme === "dark" ? "#262626" : "#ffffff";
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const borderColor = theme === "dark" ? "#444" : "#d0e0ff";
  const placeholderColor = theme === "dark" ? "#999" : "#9aa6c8";
  const focusRing = theme === "dark" ? "#33f0e0" : "#1f2a7a";

  return (
    <div className="w-full mb-6 text-sm">
      <label className="block font-medium mb-2" style={{ color: labelColor }}>
        {label}
      </label>

      <input
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{
          backgroundColor: inputBg,
          color: textColor,
          border: `1px solid ${borderColor}`,
          caretColor: focusRing,
        }}
      />
    </div>
  );
}
