import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PianoRoll from "../components/PianoRoll";
import PianoKeyboard from "../components/PianoKeyboard";
import { useTheme } from "../context/ThemeContext";
import * as Tone from "tone";
import { API_PYTHON_URL, API_EMOTION_URL } from "../apiConfig";

const NOTE_SPACING = 0.25;
const INITIAL_BUFFER_CHUNKS = 1;
const FALLBACK_BATCH_SIZE = 8;
const MIN_BUFFER_NOTES = 8;
const SERVER_CHUNK_SIZE_HINT = 8;
const EMOTION_DEBOUNCE_MS = 3000;
const STARTUP_FALLBACK_MS = 2500;

const EMOTION_RANGES = {
  relax: [48, 76],
  happy: [55, 84],
  sad: [45, 74],
  focus: [50, 79],
};

const EMOTION_SCALES = {
  relax: [0, 2, 4, 7, 9],
  happy: [0, 2, 4, 5, 7, 9, 11],
  sad: [0, 2, 3, 5, 7, 8, 10],
  focus: [0, 2, 4, 7, 9],
};

const EMOTION_ROOTS = {
  relax: 60,
  happy: 60,
  sad: 57,
  focus: 60,
};

const FALLBACK_SEEDS = {
  relax: [60, 64, 67, 71, 69, 67, 64, 62],
  happy: [60, 62, 64, 67, 69, 72, 74, 76],
  sad: [57, 60, 62, 64, 65, 64, 62, 60],
  focus: [60, 67, 64, 67, 62, 69, 65, 69],
};

const GenerateMusicPage = () => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [emotion, setEmotion] = useState(null);
  const [emotionStatus, setEmotionStatus] = useState("idle");
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
  const detectedEmotionRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const expectedChunkSizeRef = useRef(SERVER_CHUNK_SIZE_HINT);
  const recentPlayedNotesRef = useRef([60, 62, 64, 65]);
  const serverNoteMemoryRef = useRef([]);
  const fallbackCursorRef = useRef(0);
  const fallbackCycleRef = useRef(0);
  const fallbackTimeoutRef = useRef(null);
  const startupFallbackTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const emotionDebounceRef = useRef(null);
  const emotionAbortRef = useRef(null);
  const emotionRequestIdRef = useRef(0);

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

      const incomingNotes = data.notes
        .map((note) => clampMidi(note))
        .filter((note) => Number.isFinite(note));

      if (incomingNotes.length === 0) return;

      if (startupFallbackTimeoutRef.current) {
        clearTimeout(startupFallbackTimeoutRef.current);
        startupFallbackTimeoutRef.current = null;
      }

      expectedChunkSizeRef.current =
        incomingNotes.length || expectedChunkSizeRef.current;

      if (emotionRef.current && emotionRef.current !== data.emotion) {
        bufferRef.current = bufferRef.current.slice(-2);
      }

      if (data.emotion) {
        emotionRef.current = data.emotion;
        detectedEmotionRef.current = data.emotion;
        setEmotion(data.emotion);
      }

      serverNoteMemoryRef.current = [
        ...serverNoteMemoryRef.current,
        ...incomingNotes,
      ].slice(-96);

      bufferRef.current.push(...incomingNotes);

      if (!hasStartedPlaybackRef.current) {
        const neededNotes = INITIAL_BUFFER_CHUNKS * expectedChunkSizeRef.current;

        if (bufferRef.current.length >= neededNotes) {
          hasStartedPlaybackRef.current = true;
          currentTimeRef.current = Tone.now() + 0.15;
          setLoading(false);
          playFromBuffer();
        } else {
          requestMoreNotes();
        }
      } else {
        setLoading(false);
        playFromBuffer();
      }
    });

    socketRef.current.on("error", (data) => {
      console.error("Server error:", data);
      setError(data?.message || "Unknown server error");
      requestInFlightRef.current = false;
      setLoading(false);
    });

    return () => {
      clearTimers();
      if (emotionAbortRef.current) emotionAbortRef.current.abort();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    latestPromptRef.current = prompt;

    if (emotionDebounceRef.current) clearTimeout(emotionDebounceRef.current);

    if (!prompt.trim()) {
      if (!isGeneratingRef.current) {
        setEmotion(null);
        setEmotionStatus("idle");
      }
      return;
    }

    setEmotionStatus("waiting");
    emotionDebounceRef.current = setTimeout(() => {
      detectPromptEmotion(prompt);
    }, EMOTION_DEBOUNCE_MS);

    return () => {
      if (emotionDebounceRef.current) clearTimeout(emotionDebounceRef.current);
    };
  }, [prompt]);

  const clearTimers = () => {
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    if (startupFallbackTimeoutRef.current) {
      clearTimeout(startupFallbackTimeoutRef.current);
    }
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    if (emotionDebounceRef.current) clearTimeout(emotionDebounceRef.current);

    fallbackTimeoutRef.current = null;
    startupFallbackTimeoutRef.current = null;
    requestTimeoutRef.current = null;
    emotionDebounceRef.current = null;
  };

  const clampMidi = (n) => Math.max(21, Math.min(108, Math.round(Number(n))));

  const getCurrentEmotion = () =>
    emotionRef.current || detectedEmotionRef.current || "focus";

  const getEmotionRange = () =>
    EMOTION_RANGES[getCurrentEmotion()] || EMOTION_RANGES.focus;

  const foldMidiToRange = (note, range = getEmotionRange()) => {
    let folded = clampMidi(note);
    const [low, high] = range;

    while (folded < low) folded += 12;
    while (folded > high) folded -= 12;

    return Math.max(low, Math.min(high, folded));
  };

  const getScaleCandidates = (emotionLabel = getCurrentEmotion()) => {
    const range = EMOTION_RANGES[emotionLabel] || EMOTION_RANGES.focus;
    const scale = EMOTION_SCALES[emotionLabel] || EMOTION_SCALES.focus;
    const root = EMOTION_ROOTS[emotionLabel] || 60;
    const candidates = [];

    for (let octave = -3; octave <= 7; octave += 1) {
      scale.forEach((degree) => {
        const note = root + octave * 12 + degree;
        if (note >= range[0] && note <= range[1]) candidates.push(note);
      });
    }

    return candidates.length ? candidates : [60, 62, 64, 67, 69];
  };

  const nearestScaleNote = (note, emotionLabel = getCurrentEmotion()) => {
    const candidates = getScaleCandidates(emotionLabel);
    return candidates.reduce((best, candidate) =>
      Math.abs(candidate - note) < Math.abs(best - note) ? candidate : best
    );
  };

  const moveByScaleStep = (note, step, emotionLabel = getCurrentEmotion()) => {
    const candidates = getScaleCandidates(emotionLabel);
    const current = nearestScaleNote(note, emotionLabel);
    const index = Math.max(0, candidates.indexOf(current));
    const nextIndex = Math.max(0, Math.min(candidates.length - 1, index + step));
    return candidates[nextIndex];
  };

  const detectPromptEmotion = async (text, options = {}) => {
    const cleanText = text.trim();
    if (!cleanText || !API_EMOTION_URL) return null;

    const requestId = emotionRequestIdRef.current + 1;
    emotionRequestIdRef.current = requestId;

    if (emotionAbortRef.current) emotionAbortRef.current.abort();
    const controller = new AbortController();
    emotionAbortRef.current = controller;

    if (!options.silent) setEmotionStatus("detecting");

    try {
      const response = await fetch(`${API_EMOTION_URL}/detect-emotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanText }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Emotion detection failed");
      }

      if (requestId !== emotionRequestIdRef.current) return null;

      const detected = data.emotion || null;
      if (detected) {
        detectedEmotionRef.current = detected;
        emotionRef.current = detected;
        setEmotion(detected);
        setEmotionStatus("ready");

        if (isGeneratingRef.current) {
          requestMoreNotes({ force: true });
        }
      }

      return detected;
    } catch (err) {
      if (err.name === "AbortError") return null;
      console.error("Emotion detection error:", err);
      if (!options.silent) setEmotionStatus("offline");
      return null;
    }
  };

  const generateFallbackNotes = (count = FALLBACK_BATCH_SIZE) => {
    const emotionLabel = getCurrentEmotion();
    const range = EMOTION_RANGES[emotionLabel] || EMOTION_RANGES.focus;
    const seed = FALLBACK_SEEDS[emotionLabel] || FALLBACK_SEEDS.focus;
    const source =
      serverNoteMemoryRef.current.length >= 8
        ? serverNoteMemoryRef.current
        : recentPlayedNotesRef.current.length >= 8
          ? recentPlayedNotesRef.current
          : seed;

    const recent = recentPlayedNotesRef.current.slice(-12);
    const anchorSource = recent.length ? recent : source;
    const anchor =
      anchorSource.reduce((sum, note) => sum + foldMidiToRange(note, range), 0) /
      anchorSource.length;

    const contour = {
      relax: [0, -1, 1, 0, 2, 0, -1, -2],
      happy: [0, 1, 2, 1, 3, 2, 1, -1],
      sad: [0, -1, -2, -1, 1, 0, -1, -3],
      focus: [0, 2, -1, 1, 0, 2, -2, 1],
    }[emotionLabel] || [0, 1, -1, 2];

    const result = [];
    let previous = recentPlayedNotesRef.current.at(-1) ?? seed.at(-1) ?? 60;
    const cycle = fallbackCycleRef.current;

    for (let i = 0; i < count; i += 1) {
      const sourceIndex = (fallbackCursorRef.current + i) % source.length;
      let candidate = foldMidiToRange(source[sourceIndex], range);

      if (cycle % 4 === 1) {
        candidate = anchor - (candidate - anchor);
      } else if (cycle % 4 === 2) {
        const neighbor = source[(sourceIndex + 2) % source.length] ?? candidate;
        candidate = (candidate + foldMidiToRange(neighbor, range)) / 2;
      } else if (cycle % 4 === 3) {
        candidate = source[source.length - 1 - sourceIndex] ?? candidate;
      }

      candidate = foldMidiToRange(candidate + contour[i % contour.length], range);
      candidate = nearestScaleNote(candidate, emotionLabel);

      const repeated =
        candidate === previous ||
        (result.length >= 2 &&
          result.at(-1) === candidate &&
          result.at(-2) === candidate);

      if (repeated) {
        const direction = previous < (range[0] + range[1]) / 2 ? 1 : -1;
        candidate = moveByScaleStep(previous, direction, emotionLabel);
      }

      if (Math.abs(candidate - previous) > 9) {
        candidate = foldMidiToRange(
          previous + Math.sign(candidate - previous) * 5,
          range
        );
        candidate = nearestScaleNote(candidate, emotionLabel);
      }

      result.push(candidate);
      previous = candidate;
    }

    fallbackCursorRef.current =
      (fallbackCursorRef.current + count + 3) % Math.max(1, source.length);
    fallbackCycleRef.current += 1;

    console.log("Generated fallback notes:", result);
    return result;
  };

  const startPlaybackFromFallback = () => {
    if (!isGeneratingRef.current || hasStartedPlaybackRef.current) return;

    const fallbackNotes = generateFallbackNotes(FALLBACK_BATCH_SIZE);
    bufferRef.current.push(...fallbackNotes);
    hasStartedPlaybackRef.current = true;
    currentTimeRef.current = Tone.now() + 0.15;
    setLoading(false);
    playFromBuffer();
    requestMoreNotes({ force: true });
  };

  const scheduleFallbackIfNeeded = () => {
    if (!isGeneratingRef.current) return;
    if (!hasStartedPlaybackRef.current) return;
    if (bufferRef.current.length >= MIN_BUFFER_NOTES) return;
    if (fallbackTimeoutRef.current) return;

    const now = Tone.now();
    const remainingSeconds = Math.max(0, currentTimeRef.current - now);
    const triggerMs = Math.max(180, remainingSeconds * 1000 - 260);

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

    bufferRef.current = [];
    currentTimeRef.current = 0;
    isGeneratingRef.current = true;
    requestInFlightRef.current = false;
    hasStartedPlaybackRef.current = false;
    expectedChunkSizeRef.current = SERVER_CHUNK_SIZE_HINT;
    recentPlayedNotesRef.current = [60, 62, 64, 65];
    serverNoteMemoryRef.current = [];
    fallbackCursorRef.current = 0;
    fallbackCycleRef.current = 0;

    clearTimers();

    latestPromptRef.current = prompt;

    const detectedEmotion =
      detectedEmotionRef.current || (await detectPromptEmotion(prompt, { silent: true }));

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

    socketRef.current.emit("start_music", {
      user_text: prompt,
      emotion: detectedEmotion,
      chunk_size: SERVER_CHUNK_SIZE_HINT,
    });

    startupFallbackTimeoutRef.current = setTimeout(
      startPlaybackFromFallback,
      STARTUP_FALLBACK_MS
    );
  };

  const requestMoreNotes = (options = {}) => {
    if (!isGeneratingRef.current) return;
    if (!socketRef.current?.connected) return;
    if (requestInFlightRef.current && !options.force) return;

    requestInFlightRef.current = true;
    socketRef.current.emit("request_more", {
      user_text: latestPromptRef.current,
      emotion: getCurrentEmotion(),
      chunk_size: SERVER_CHUNK_SIZE_HINT,
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
    ].slice(-48);

    bufferRef.current = [];

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    requestTimeoutRef.current = setTimeout(() => {
      requestTimeoutRef.current = null;
      requestMoreNotes();
      scheduleFallbackIfNeeded();
    }, Math.max(250, chunkDuration * 1000 * 0.45));

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

    clearTimers();

    if (emotionAbortRef.current) emotionAbortRef.current.abort();
    if (synthRef.current) synthRef.current.dispose();

    synthRef.current = null;
    bufferRef.current = [];
    currentTimeRef.current = 0;
    emotionRef.current = detectedEmotionRef.current;
    recentPlayedNotesRef.current = [60, 62, 64, 65];
    serverNoteMemoryRef.current = [];
    fallbackCursorRef.current = 0;
    fallbackCycleRef.current = 0;

    setNotes([]);
    setActiveNote(null);

    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

  const pageBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e0f5f2" : "#1f2a7a";
  const inputBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const inputBorder = theme === "dark" ? "#2f2f2f" : "#d0e0ff";

  const emotionStatusText = {
    waiting: "Reading prompt after you pause...",
    detecting: "Detecting emotion...",
    ready: "Emotion ready",
    offline: "Emotion detector unavailable; music server will infer it",
  }[emotionStatus];

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
          className="w-full p-4 rounded-xl mb-4 text-lg"
          style={{
            backgroundColor: inputBg,
            border: `1px solid ${inputBorder}`,
            color: textColor,
            minHeight: "120px",
          }}
        />

        {emotionStatusText && (
          <div className="text-sm mb-6 opacity-80">{emotionStatusText}</div>
        )}

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
