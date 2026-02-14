import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function BottomText({ textBefore, linkHref, linkText }) {
  const { theme } = useTheme();

  const linkHoverOpacity = theme === "dark" ? "opacity-90" : "opacity-80";
   const textColor = theme === "dark" ? "#9ca3af" : "#6a6f85";
  const linkColor = theme === "dark" ? "#33f0e0" : "#1f2a7a";
  const hoverColor = theme === "dark" ? "#5ff7ec" : "#2f3fdc";

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
