import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function InputField({ label, type = "text", placeholder, value, onChange }) {
  const { theme } = useTheme();

  // Theme-based styles
  const labelColor = "#7a1f2a"; // keep original label color
  const inputBg = theme === "dark" ? "#3a3a3a" : "#fff";
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const borderColor = theme === "dark" ? "#555" : "#d5c9be";
  const placeholderColor = theme === "dark" ? "#aaa" : "#b8b8b8";
  const focusRing = "#7a1f2a";

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
