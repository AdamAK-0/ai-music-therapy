import React, { useEffect, useRef, useState } from "react";

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;
const WHITE_KEY_WIDTH = 32;
const BLACK_KEY_WIDTH_RATIO = 0.58;
const WHITE_KEY_HEIGHT = 160;
const BLACK_KEY_HEIGHT = 90;

const isBlack = (midi) => {
  const note = midi % 12;
  return [1, 3, 6, 8, 10].includes(note);
};

const WHITE_KEY_COUNT = Array.from({ length: TOTAL_KEYS }, (_, i) => FIRST_MIDI + i)
  .filter((midi) => !isBlack(midi)).length;
const BASE_KEYBOARD_WIDTH = WHITE_KEY_COUNT * WHITE_KEY_WIDTH;

// Map emotion to color
const emotionColors = {
  happy: "#ffeb3b",
  sad: "#2196f3",
  focus: "#4fd1c5",
  relax: "#36f446",
};

const PianoKeyboard = ({ activeNote, emotion }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(BASE_KEYBOARD_WIDTH);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateWidth = () => {
      const nextWidth = container.getBoundingClientRect().width;
      if (nextWidth > 0) setContainerWidth(nextWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const whiteWidth = Math.min(
    WHITE_KEY_WIDTH,
    containerWidth / WHITE_KEY_COUNT
  );
  const blackWidth = Math.max(3, whiteWidth * BLACK_KEY_WIDTH_RATIO);
  const isMobileWidth = containerWidth < 640;
  const heightScale = isMobileWidth
    ? 0.38
    : Math.max(0.82, Math.min(1, whiteWidth / WHITE_KEY_WIDTH));
  const whiteHeight = WHITE_KEY_HEIGHT * heightScale;
  const blackHeight = BLACK_KEY_HEIGHT * heightScale;
  const topMargin = Math.max(14, 30 * heightScale);
  const keys = [];

  for (let i = 0; i < TOTAL_KEYS; i++) {
    const midi = FIRST_MIDI + i;
    const black = isBlack(midi);

    const isActive = activeNote === midi;
    const bgColor = isActive
      ? emotionColors[emotion] || "#4fd1c5"
      : black
      ? "#000"
      : "#fff";

    keys.push(
      <div
        key={midi}
        style={{
          width: black ? blackWidth : whiteWidth,
          height: black ? blackHeight : whiteHeight,
          marginLeft: black ? -blackWidth / 2 : 0,
          marginRight: black ? -blackWidth / 2 : 0,
          boxSizing: "border-box",
          flex: "0 0 auto",
          zIndex: black ? 2 : 1,
          position: "relative",
          background: bgColor,
          border: black ? "none" : "1px solid #333",
          boxShadow: isActive
            ? "inset 0px 3px 6px rgba(0,0,0,0.5)"
            : "none",
          transform: isActive ? "translateY(2px)" : "translateY(0)",
          transition: "all 0.1s ease-in-out",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        userSelect: "none",
        marginTop: topMargin,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          position: "relative",
          height: whiteHeight,
          width: "100%",
        }}
      >
        {keys}
      </div>
    </div>
  );
};

export default PianoKeyboard;
