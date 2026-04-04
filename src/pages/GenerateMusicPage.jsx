import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PianoRoll from "../components/PianoRoll";
import PianoKeyboard from "../components/PianoKeyboard";
import { useTheme } from "../context/ThemeContext";
import * as Tone from "tone";
import { API_PYTHON_URL } from "../apiConfig";

const NOTE_SPACING = 0.25;
const INITIAL_BUFFER_CHUNKS = 2;
const FALLBACK_BATCH_SIZE = 2;
const MIN_BUFFER_NOTES = 6;

const GenerateMusicPage = () => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [emotion, setEmotion] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeNote, setActiveNote] = useState(null);

  const synthRef = useRef(null);
  const bufferRef = useRef([]);
  const currentTimeRef = useRef(0);
  const isGeneratingRef = useRef(false);
  const socketRef = useRef(null);
  const latestPromptRef = useRef("");
  const emotionRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const expectedChunkSizeRef = useRef(8);
  const recentPlayedNotesRef = useRef([60, 62, 64, 65]);
  const fallbackTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_PYTHON_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      setError(null);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connect_error:", err);
      setError(`Connection failed: ${err.message}`);
    });

    socketRef.current.on("new_notes", (data) => {
      console.log("Received new_notes:", data);

      requestInFlightRef.current = false;

      if (!data || !Array.isArray(data.notes)) {
        setError("Invalid notes received from server");
        return;
      }

      expectedChunkSizeRef.current = data.notes.length || expectedChunkSizeRef.current;

      if (emotionRef.current && emotionRef.current !== data.emotion) {
        bufferRef.current = bufferRef.current.slice(-2);
      }

      emotionRef.current = data.emotion;
      setEmotion(data.emotion);

      bufferRef.current.push(...data.notes);

      if (!hasStartedPlaybackRef.current) {
        const neededNotes = INITIAL_BUFFER_CHUNKS * expectedChunkSizeRef.current;

        if (bufferRef.current.length >= neededNotes) {
          hasStartedPlaybackRef.current = true;
          currentTimeRef.current = Tone.now() + 0.15;
          playFromBuffer();
        } else {
          requestMoreNotes();
        }
      } else {
        playFromBuffer();
      }
    });

    socketRef.current.on("error", (data) => {
      console.error("Server error:", data);
      setError(data?.message || "Unknown server error");
    });

    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const clampMidi = (n) => Math.max(21, Math.min(108, Math.round(n)));

  const getEmotionStep = () => {
    switch (emotionRef.current) {
      case "happy":
        return [2, 2, 1, 2];
      case "sad":
        return [-2, -1, -2, 1];
      case "relax":
        return [1, -1, 2, -2];
      case "focus":
      default:
        return [1, 1, -1, 2];
    }
  };

  const generateFallbackNotes = (count = FALLBACK_BATCH_SIZE) => {
    const history = recentPlayedNotesRef.current.length
      ? [...recentPlayedNotesRef.current]
      : [60, 62, 64, 65];

    const pattern = getEmotionStep();
    const result = [];
    let last = history[history.length - 1] ?? 60;

    for (let i = 0; i < count; i++) {
      const historyIndex = history.length - 1 - (i % Math.min(history.length, 4));
      const base = history[Math.max(0, historyIndex)];
      const step = pattern[i % pattern.length];

      let next;
      if (i % 2 === 0) {
        next = last + step;
      } else {
        next = base + step;
      }

      next = clampMidi(next);
      result.push(next);
      last = next;
    }

    console.log("Generated fallback notes:", result);
    return result;
  };

  const scheduleFallbackIfNeeded = () => {
    if (!isGeneratingRef.current) return;
    if (!hasStartedPlaybackRef.current) return;
    if (bufferRef.current.length >= MIN_BUFFER_NOTES) return;
    if (fallbackTimeoutRef.current) return;

    const now = Tone.now();
    const remainingSeconds = Math.max(0, currentTimeRef.current - now);
    const triggerMs = Math.max(120, remainingSeconds * 1000 - 180);

    fallbackTimeoutRef.current = setTimeout(() => {
      fallbackTimeoutRef.current = null;

      if (!isGeneratingRef.current) return;
      if (bufferRef.current.length >= MIN_BUFFER_NOTES) return;

      const fallbackNotes = generateFallbackNotes(FALLBACK_BATCH_SIZE);
      bufferRef.current.push(...fallbackNotes);
      playFromBuffer();
    }, triggerMs);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setNotes([]);
    setEmotion(null);

    bufferRef.current = [];
    currentTimeRef.current = 0;
    isGeneratingRef.current = true;
    requestInFlightRef.current = false;
    hasStartedPlaybackRef.current = false;
    expectedChunkSizeRef.current = 8;
    recentPlayedNotesRef.current = [60, 62, 64, 65];

    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    fallbackTimeoutRef.current = null;
    requestTimeoutRef.current = null;

    latestPromptRef.current = prompt;

    await Tone.start();

    if (Tone.context.state !== "running") {
      await Tone.context.resume();
    }

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.start();

    if (synthRef.current) synthRef.current.dispose();

    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.2,
      },
    }).toDestination();

    socketRef.current.emit("start_music", { user_text: prompt });

    setLoading(false);
  };

  const requestMoreNotes = () => {
    if (!isGeneratingRef.current) return;
    if (!socketRef.current?.connected) return;
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    socketRef.current.emit("request_more", {
      user_text: latestPromptRef.current,
    });
  };

  const playFromBuffer = () => {
    if (!synthRef.current || bufferRef.current.length === 0) return;

    const notesToPlay = [...bufferRef.current];
    const chunkDuration = notesToPlay.length * NOTE_SPACING;
    const now = Tone.now();

    if (currentTimeRef.current === 0 || currentTimeRef.current < now + 0.08) {
      currentTimeRef.current = now + 0.12;
    }

    notesToPlay.forEach((pitch, index) => {
      const safePitch = clampMidi(pitch);
      const freq = 440 * Math.pow(2, (safePitch - 69) / 12);
      const time = currentTimeRef.current + index * NOTE_SPACING;

      synthRef.current.triggerAttackRelease(freq, NOTE_SPACING * 0.9, time);

      const msUntilNote = Math.max(0, (time - Tone.now()) * 1000);

      setTimeout(() => {
        setActiveNote(safePitch);
        setTimeout(() => setActiveNote(null), 120);
      }, msUntilNote);
    });

    currentTimeRef.current += chunkDuration;
    setNotes((prev) => [...prev, ...notesToPlay]);

    recentPlayedNotesRef.current = [
      ...recentPlayedNotesRef.current,
      ...notesToPlay.map(clampMidi),
    ].slice(-12);

    bufferRef.current = [];

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    requestTimeoutRef.current = setTimeout(() => {
      requestTimeoutRef.current = null;
      requestMoreNotes();
      scheduleFallbackIfNeeded();
    }, Math.max(60, chunkDuration * 1000 * 0.15));

    scheduleFallbackIfNeeded();
  };

  const handlePromptChange = (e) => {
    const newText = e.target.value;
    setPrompt(newText);
    latestPromptRef.current = newText;
  };

  const stopMusic = () => {
    isGeneratingRef.current = false;
    requestInFlightRef.current = false;
    hasStartedPlaybackRef.current = false;

    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    fallbackTimeoutRef.current = null;
    requestTimeoutRef.current = null;

    if (synthRef.current) synthRef.current.dispose();

    synthRef.current = null;
    bufferRef.current = [];
    currentTimeRef.current = 0;
    emotionRef.current = null;
    recentPlayedNotesRef.current = [60, 62, 64, 65];

    setNotes([]);
    setEmotion(null);
    setActiveNote(null);

    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

  const pageBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e0f5f2" : "#1f2a7a";
  const inputBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const inputBorder = theme === "dark" ? "#2f2f2f" : "#d0e0ff";

  return (
    <div style={{ backgroundColor: pageBg, color: textColor, minHeight: "100vh" }}>
      <Header />

      <section className="px-6 py-16 text-center max-w-4xl mx-auto">
        <h2 style={{ color: titleColor }} className="text-4xl font-bold mb-8">
          AI Music Therapy Generator
        </h2>

        <textarea
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Describe how you feel..."
          className="w-full p-4 rounded-xl mb-6 text-lg"
          style={{
            backgroundColor: inputBg,
            border: `1px solid ${inputBorder}`,
            color: textColor,
            minHeight: "120px",
          }}
        />

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Buffering..." : "Start Music"}
          </button>

          <button
            onClick={stopMusic}
            className="px-6 py-3 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            Stop
          </button>
        </div>

        {emotion && (
          <div className="text-lg font-semibold mb-6">
            Emotion detected: <span style={{ color: "#4fd1c5" }}>{emotion}</span>
          </div>
        )}

        <PianoRoll notes={notes} emotion={emotion} />
        <PianoKeyboard activeNote={activeNote} emotion={emotion} />

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </section>

      <Footer />
    </div>
  );
};

export default GenerateMusicPage;