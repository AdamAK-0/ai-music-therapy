import React, { useEffect, useRef } from "react";

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;
const ROLL_HEIGHT = 200;
const MIN_ROLL_WIDTH = 800;
const NOTE_SPACING = 20;
const NOTE_WIDTH = 18;
const NOTE_HEIGHT = 4;

// Map emotions to colors (same as keyboard)
const EMOTION_COLORS = {
  happy: "#ffeb3b",
  sad: "#2196f3",
  focus: "#4fd1c5",
  relax: "#36f446",
  default: "#4fd1c5",
};

const PianoRoll = ({ notes = [], emotion }) => {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const canvasWidth = Math.max(
    MIN_ROLL_WIDTH,
    notes.length * NOTE_SPACING + NOTE_WIDTH + 24
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    notes.forEach((note, index) => {
      const x = 12 + index * NOTE_SPACING;
      const pitchPosition = (note - FIRST_MIDI) / (TOTAL_KEYS - 1);
      const y = (height - NOTE_HEIGHT) - pitchPosition * (height - NOTE_HEIGHT);
      ctx.fillStyle = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
      ctx.fillRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    });
  }, [notes, emotion, canvasWidth]);

  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth;
  }, [canvasWidth, notes.length]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        width: "100%",
        overflowX: "auto",
        paddingBottom: 8,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={ROLL_HEIGHT}
        style={{
          width: canvasWidth,
          height: ROLL_HEIGHT,
          display: "block",
          maxWidth: "none",
          border: "1px solid #333",
          borderRadius: 6,
          marginBottom: 12,
        }}
      />
    </div>
  );
};

export default PianoRoll;
