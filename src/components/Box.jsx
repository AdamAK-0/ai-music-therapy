import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Box({ children }) {
  const { theme } = useTheme();

  // Theme-based styles
  const bgColor = theme === "dark" ? "#2a2a2a" : "#ffffff";
  const borderColor = theme === "dark" ? "#444" : "#f1e6da";
  const shadowColor = theme === "dark"
    ? "0 30px 80px rgba(31, 52, 122, 0.2)"
    : "0 30px 80px rgba(31, 37, 122, 0.08)";

  return (
    <div className="mt-8 flex justify-center px-4 pb-16">
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          boxShadow: shadowColor,
        }}
      >
        {children}
      </div>
    </div>
  );
}
