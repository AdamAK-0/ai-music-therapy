import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Title({ heading, subheading }) {
  const { theme } = useTheme();

  // FIX: heading now changes for dark mode
  const headingColor = theme === "dark" ? "#80e0ff" : "#1f4aa0";

  const subheadingColor = theme === "dark" ? "#ccc" : "#6b6b6b";

  return (
    <div className="text-center max-w-2xl mx-auto px-4">
      <h1
        className="text-3xl font-bold mb-3 transition-colors duration-300"
        style={{ color: headingColor }}
      >
        {heading}
      </h1>
      <p
        className="text-base leading-snug transition-colors duration-300"
        style={{ color: subheadingColor }}
      >
        {subheading}
      </p>
    </div>
  );
}
