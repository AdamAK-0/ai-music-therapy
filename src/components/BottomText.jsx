import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function BottomText({ textBefore, linkHref, linkText }) {
  const { theme } = useTheme();

  const textColor = theme === "dark" ? "#ccc" : "#6b6b6b"; // main text
  const linkColor = theme === "dark" ? "#e5a1a1" : "#7a1f2a"; // link color
  const linkHoverOpacity = theme === "dark" ? "opacity-90" : "opacity-80";

  return (
    <p
      className="text-center text-xs mt-6"
      style={{ color: textColor }}
    >
      {textBefore}{" "}
      <a
        href={linkHref}
        className={`font-medium underline hover:${linkHoverOpacity}`}
        style={{ color: linkColor }}
      >
        {linkText}
      </a>
    </p>
  );
}
