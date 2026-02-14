import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Checkbox({ checked, onChange }) {
  const { theme } = useTheme();

  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const linkColor = "#7a1f2a";
  const borderColor = linkColor;
  const ringColor = linkColor;

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
