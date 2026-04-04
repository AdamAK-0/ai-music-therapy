import React, { useEffect, useRef } from "react";

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;

// Map emotions to colors (same as keyboard)
const EMOTION_COLORS = {
  happy: "#ffeb3b",
  sad: "#2196f3",
  focus: "#4fd1c5",
  relax: "#36f446",
};

const PianoRoll = ({ notes, emotion }) => {
  const canvasRef = useRef(null);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Determine horizontal spacing
    const spacing = 20;
    const noteWidth = 18;
    const noteHeight = 4;

    // If total width exceeds canvas, update scroll
    const totalWidth = notes.length * spacing;
    if (totalWidth > width) {
      scrollOffsetRef.current = totalWidth - width;
    }

    // Draw each note
    notes.forEach((note, index) => {
      const x = index * spacing - scrollOffsetRef.current;
      const y = height - (note - FIRST_MIDI) * 2;
      ctx.fillStyle = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
      ctx.fillRect(x, y, noteWidth, noteHeight);
    });
  }, [notes, emotion]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      style={{ border: "1px solid #333", marginBottom: 20 }}
    />
  );
};

export default PianoRoll;