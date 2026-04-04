import React from "react";

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;

const isBlack = (midi) => {
  const note = midi % 12;
  return [1, 3, 6, 8, 10].includes(note);
};

// Map emotion to color
const emotionColors = {
  happy: "#ffeb3b",
  sad: "#2196f3",
  focus: "#4fd1c5",
  relax: "#36f446",
};

const PianoKeyboard = ({ activeNote, emotion }) => {
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
          width: black ? 18 : 32,
          height: black ? 90 : 160,
          marginLeft: black ? -9 : 0,
          marginRight: black ? -9 : 0,
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
      style={{
        display: "flex",
        justifyContent: "center",
        position: "relative",
        userSelect: "none",
        marginTop: 30,
      }}
    >
      {keys}
    </div>
  );
};

export default PianoKeyboard;