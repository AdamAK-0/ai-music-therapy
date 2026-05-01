import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity,
  Gauge,
  Mic,
  MicOff,
  Music2,
  Radio,
  Sparkles,
  Square,
  Waves,
  Zap,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PianoRoll from "../components/PianoRoll";
import PianoKeyboard from "../components/PianoKeyboard";
import { useTheme } from "../context/ThemeContext";
import * as Tone from "tone";
import {
  API_EMOTION_URL,
  API_MUSIC_SERVER2_URL,
  API_PYTHON_URL,
} from "../apiConfig";

const NOTE_SPACING = 0.25;
const DEFAULT_NOTE_TICKS = 480;
const INITIAL_BUFFER_CHUNKS = 1;
const STREAM_V3_INITIAL_BUFFER_CHUNKS = 2;
const STREAM_V3_REFILL_QUEUE_NOTES = 16;
const STREAM_V3_FALLBACK_BATCH_SIZE = 4;
const STREAM_V3_DEFAULT_NOTE_TICKS = 960;
const STREAM_V3_DEFAULT_VELOCITY = 76;
const FALLBACK_BATCH_SIZE = 8;
const MIN_BUFFER_NOTES = 8;
const SERVER_CHUNK_SIZE_HINT = 8;
const EMOTION_DEBOUNCE_MS = 3000;
const STARTUP_FALLBACK_MS = 2500;
const SONG_TEMPERATURE = 0.85;
const STREAM_TEMPERATURE = 0.9;

const MODEL_OPTIONS = [
  {
    id: "classic-live",
    title: "Classic Live",
    eyebrow: "Original",
    mode: "Live notes",
    type: "stream",
    url: API_PYTHON_URL,
    icon: Radio,
    accent: "#4fd1c5",
    stat: "Fast fallback",
    description: "The current live server with the original model and local shaping.",
  },
  {
    id: "stream-v3",
    title: "Stream V3",
    eyebrow: "New",
    mode: "Live notes",
    type: "stream",
    url: API_MUSIC_SERVER2_URL,
    icon: Zap,
    accent: "#7c5cff",
    stat: "53.2% pitch top-5",
    description: "A stronger real-time note model trained with AILabs pretraining and EMOPIA fine-tuning.",
    temperature: STREAM_TEMPERATURE,
  },
  {
    id: "song-v2",
    title: "Song V2",
    eyebrow: "Full clip",
    mode: "Therapy piece",
    type: "song",
    url: API_MUSIC_SERVER2_URL,
    icon: Music2,
    accent: "#ffb347",
    stat: "342-note demos",
    description: "A full symbolic music generator for longer instrumental therapy clips.",
    events: 512,
  },
];

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

const statusLabels = {
  idle: "Ready when your prompt is",
  connecting: "Connecting to live model...",
  connected: "Live model connected",
  offline: "Live model offline",
  composing: "Composing full therapy clip...",
};

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const mergeSpeechPrompt = (base, addition) =>
  [base, addition]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");

const GenerateMusicPage = () => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [emotion, setEmotion] = useState(null);
  const [emotionStatus, setEmotionStatus] = useState("idle");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState("classic-live");
  const [modelStatus, setModelStatus] = useState("idle");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");

  const selectedModel = useMemo(
    () =>
      MODEL_OPTIONS.find((model) => model.id === selectedModelId) ||
      MODEL_OPTIONS[0],
    [selectedModelId]
  );

  const synthRef = useRef(null);
  const bufferRef = useRef([]);
  const currentTimeRef = useRef(0);
  const isGeneratingRef = useRef(false);
  const socketRef = useRef(null);
  const selectedModelRef = useRef(selectedModel);
  const latestPromptRef = useRef("");
  const emotionRef = useRef(null);
  const detectedEmotionRef = useRef(null);
  const detectedPromptRef = useRef("");
  const requestInFlightRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const expectedChunkSizeRef = useRef(SERVER_CHUNK_SIZE_HINT);
  const recentPlayedNotesRef = useRef([60, 62, 64, 65]);
  const serverNoteMemoryRef = useRef([]);
  const serverEventMemoryRef = useRef([]);
  const fallbackCursorRef = useRef(0);
  const fallbackCycleRef = useRef(0);
  const fallbackTimeoutRef = useRef(null);
  const startupFallbackTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const streamV3PlaybackTimerRef = useRef(null);
  const playbackEndTimeoutRef = useRef(null);
  const emotionDebounceRef = useRef(null);
  const emotionAbortRef = useRef(null);
  const emotionRequestIdRef = useRef(0);
  const scheduledVisualTimersRef = useRef([]);
  const recognitionRef = useRef(null);
  const speechBasePromptRef = useRef("");
  const recognitionHadErrorRef = useRef(false);
  const lastSpeechTranscriptRef = useRef("");
  const shouldKeepListeningRef = useRef(false);
  const speechStopRequestedRef = useRef(false);
  const speechRestartTimerRef = useRef(null);

  const commitSpeechTranscript = (message = "Voice added to prompt.") => {
    const transcript = lastSpeechTranscriptRef.current.trim();

    if (!transcript) {
      setSpeechStatus("No speech detected. Try again.");
      return false;
    }

    const nextPrompt = mergeSpeechPrompt(speechBasePromptRef.current, transcript);
    setPrompt(nextPrompt);
    latestPromptRef.current = nextPrompt;
    speechBasePromptRef.current = nextPrompt;
    lastSpeechTranscriptRef.current = "";
    setSpeechStatus(message);
    return true;
  };

  const clearSpeechRestartTimer = () => {
    if (!speechRestartTimerRef.current) return;
    clearTimeout(speechRestartTimerRef.current);
    speechRestartTimerRef.current = null;
  };

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    setSpeechSupported(Boolean(Recognition));

    if (!Recognition) return undefined;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      recognitionHadErrorRef.current = false;
      clearSpeechRestartTimer();
      lastSpeechTranscriptRef.current = "";
      setIsListening(true);
      setSpeechStatus("Listening...");
    };

    recognition.onend = () => {
      if (speechStopRequestedRef.current || !shouldKeepListeningRef.current) {
        speechStopRequestedRef.current = false;
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        if (!recognitionHadErrorRef.current) commitSpeechTranscript();
        return;
      }

      if (lastSpeechTranscriptRef.current.trim()) {
        commitSpeechTranscript("Voice added. Keep talking or tap Stop Voice.");
      } else {
        setSpeechStatus("Still listening. Speak near your microphone.");
      }

      speechRestartTimerRef.current = setTimeout(() => {
        try {
          recognition.start();
        } catch (err) {
          if (err.name !== "InvalidStateError") {
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            setSpeechStatus("Voice input could not restart.");
          }
        }
      }, 350);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setSpeechStatus("No speech detected yet. Still listening...");
        return;
      }

      if (event.error === "aborted" && speechStopRequestedRef.current) {
        return;
      }

      recognitionHadErrorRef.current = true;
      shouldKeepListeningRef.current = false;
      clearSpeechRestartTimer();
      setIsListening(false);

      const speechErrorMessages = {
        "audio-capture": "No microphone was found. Check your input device.",
        network: "Speech recognition service is unavailable.",
        "not-allowed": "Microphone access blocked.",
        "service-not-allowed": "Speech recognition is blocked in this browser.",
        "language-not-supported": "Speech recognition does not support this language.",
      };

      setSpeechStatus(
        speechErrorMessages[event.error] || `Voice input stopped: ${event.error}.`
      );
    };

    recognition.onresult = (event) => {
      const transcriptParts = [];

      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (transcript.trim()) transcriptParts.push(transcript);
      }

      const transcript = transcriptParts.join(" ").trim();
      lastSpeechTranscriptRef.current = transcript;
      const nextPrompt = mergeSpeechPrompt(speechBasePromptRef.current, transcript);
      setPrompt(nextPrompt);
      latestPromptRef.current = nextPrompt;
      setSpeechStatus("Listening... speech detected");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        clearSpeechRestartTimer();
        shouldKeepListeningRef.current = false;
        recognition.stop();
      } catch {
        // Ignore cleanup errors when recognition is already inactive.
      }
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    latestPromptRef.current = prompt;

    if (emotionDebounceRef.current) clearTimeout(emotionDebounceRef.current);

    if (!prompt.trim()) {
      if (!isGeneratingRef.current) {
        setEmotion(null);
        setEmotionStatus("idle");
        detectedPromptRef.current = "";
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
    // The detector reads current request state through refs, so tying this
    // effect to the function identity would restart the debounce unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  useEffect(() => {
    requestInFlightRef.current = false;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (selectedModel.type !== "stream") {
      setModelStatus("idle");
      return undefined;
    }

    setModelStatus("connecting");
    const socket = io(selectedModel.url, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`${selectedModel.title} socket connected:`, socket.id);
      setModelStatus("connected");
      setError(null);
    });

    socket.on("connect_error", (err) => {
      console.error(`${selectedModel.title} socket error:`, err);
      setModelStatus("offline");
      setError(`${selectedModel.title} connection failed: ${err.message}`);
    });

    socket.on("new_notes", (data) => {
      console.log(`Received ${selectedModel.title} new_notes:`, data);
      requestInFlightRef.current = false;
      handleIncomingNotes(data);
    });

    socket.on("error", (data) => {
      console.error(`${selectedModel.title} server error:`, data);
      setError(data?.message || "Unknown music server error");
      requestInFlightRef.current = false;
      setLoading(false);
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // Socket handlers use refs for live playback state; this effect should only
    // reconnect when the selected model endpoint changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel.id, selectedModel.title, selectedModel.type, selectedModel.url]);

  const clearTimers = () => {
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    if (startupFallbackTimeoutRef.current) {
      clearTimeout(startupFallbackTimeoutRef.current);
    }
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    if (streamV3PlaybackTimerRef.current) {
      clearTimeout(streamV3PlaybackTimerRef.current);
    }
    if (playbackEndTimeoutRef.current) clearTimeout(playbackEndTimeoutRef.current);
    if (emotionDebounceRef.current) clearTimeout(emotionDebounceRef.current);

    scheduledVisualTimersRef.current.forEach((timer) => clearTimeout(timer));
    scheduledVisualTimersRef.current = [];

    fallbackTimeoutRef.current = null;
    startupFallbackTimeoutRef.current = null;
    requestTimeoutRef.current = null;
    streamV3PlaybackTimerRef.current = null;
    playbackEndTimeoutRef.current = null;
    emotionDebounceRef.current = null;
  };

  const clearPendingFallbackTimer = () => {
    if (!fallbackTimeoutRef.current) return;
    clearTimeout(fallbackTimeoutRef.current);
    fallbackTimeoutRef.current = null;
  };

  const clampMidi = (n) => Math.max(21, Math.min(108, Math.round(Number(n))));

  const clampVelocity = (value) =>
    Math.max(24, Math.min(120, Math.round(Number(value) || 72)));

  const clampDuration = (value) =>
    Math.max(80, Math.min(1920, Math.round(Number(value) || DEFAULT_NOTE_TICKS)));

  const makeNoteEvent = (pitch, duration = null, velocity = 72) => ({
    pitch: clampMidi(pitch),
    duration: duration ? clampDuration(duration) : null,
    velocity: clampVelocity(velocity),
  });

  const normalizeNoteEvents = (payload) => {
    if (!payload) return [];

    if (Array.isArray(payload.note_events) && payload.note_events.length) {
      return payload.note_events
        .map((event) => makeNoteEvent(event.pitch, event.duration, event.velocity))
        .filter((event) => Number.isFinite(event.pitch));
    }

    const rawNotes = Array.isArray(payload.notes) ? payload.notes : payload;
    if (!Array.isArray(rawNotes)) return [];

    return rawNotes
      .map((note) => {
        if (typeof note === "object" && note !== null) {
          return makeNoteEvent(note.pitch, note.duration, note.velocity);
        }
        return makeNoteEvent(note);
      })
      .filter((event) => Number.isFinite(event.pitch));
  };

  const getCurrentEmotion = () =>
    emotionRef.current || detectedEmotionRef.current || "focus";

  const getStreamTemperature = () =>
    selectedModelRef.current.temperature ?? STREAM_TEMPERATURE;

  const isStreamV3Selected = () => selectedModelRef.current.id === "stream-v3";

  const getInitialBufferChunks = () =>
    isStreamV3Selected() ? STREAM_V3_INITIAL_BUFFER_CHUNKS : INITIAL_BUFFER_CHUNKS;

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
        detectedPromptRef.current = cleanText;
        emotionRef.current = detected;
        setEmotion(detected);
        setEmotionStatus("ready");

        if (
          isGeneratingRef.current &&
          selectedModelRef.current.type === "stream"
        ) {
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

  const generateFallbackEvents = (count = FALLBACK_BATCH_SIZE) => {
    const fallbackNotes = generateFallbackNotes(count);

    if (!isStreamV3Selected()) {
      return fallbackNotes.map((note) => makeNoteEvent(note));
    }

    const rhythmSource = serverEventMemoryRef.current.length
      ? serverEventMemoryRef.current
      : [
          makeNoteEvent(
            recentPlayedNotesRef.current.at(-1) || 60,
            STREAM_V3_DEFAULT_NOTE_TICKS,
            STREAM_V3_DEFAULT_VELOCITY
          ),
        ];

    return fallbackNotes.map((note, index) => {
      const sourceEvent = rhythmSource[
        (fallbackCursorRef.current + index) % rhythmSource.length
      ] || {
        duration: STREAM_V3_DEFAULT_NOTE_TICKS,
        velocity: STREAM_V3_DEFAULT_VELOCITY,
      };

      return makeNoteEvent(
        note,
        sourceEvent.duration || STREAM_V3_DEFAULT_NOTE_TICKS,
        sourceEvent.velocity || STREAM_V3_DEFAULT_VELOCITY
      );
    });
  };

  const initializeSynth = async () => {
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
        release: 0.25,
      },
    }).toDestination();
  };

  const resetPlaybackState = () => {
    setNotes([]);
    bufferRef.current = [];
    currentTimeRef.current = 0;
    requestInFlightRef.current = false;
    hasStartedPlaybackRef.current = false;
    expectedChunkSizeRef.current = SERVER_CHUNK_SIZE_HINT;
    recentPlayedNotesRef.current = [60, 62, 64, 65];
    serverNoteMemoryRef.current = [];
    serverEventMemoryRef.current = [];
    fallbackCursorRef.current = 0;
    fallbackCycleRef.current = 0;
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
    serverEventMemoryRef.current = [];
    fallbackCursorRef.current = 0;
    fallbackCycleRef.current = 0;

    setLoading(false);
    setNotes([]);
    setActiveNote(null);

    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

  const getPlaybackDuration = (event) => {
    if (!event.duration) return NOTE_SPACING;

    const model = selectedModelRef.current;
    const maxDuration = model.type === "song" ? 1.2 : 0.75;
    return Math.max(0.1, Math.min(maxDuration, event.duration * 0.001));
  };

  const getPlaybackStep = (event) =>
    event.duration ? getPlaybackDuration(event) * 0.82 : NOTE_SPACING;

  const playStreamV3Queue = () => {
    if (!isGeneratingRef.current || !isStreamV3Selected()) return;
    if (!synthRef.current) return;
    if (streamV3PlaybackTimerRef.current) return;

    const event = bufferRef.current.shift();

    if (!event) {
      requestMoreNotes();
      const fallbackEvents = generateFallbackEvents(STREAM_V3_FALLBACK_BATCH_SIZE);

      if (fallbackEvents.length) {
        bufferRef.current.push(...fallbackEvents);
        setLoading(false);
        playStreamV3Queue();
        return;
      }

      setLoading(true);
      return;
    }

    setLoading(false);

    const safePitch = clampMidi(event.pitch);
    const freq = 440 * Math.pow(2, (safePitch - 69) / 12);
    const duration = getPlaybackDuration(event);
    const step = getPlaybackStep(event);
    const time = Tone.now() + 0.03;
    const velocity = Math.max(0.2, Math.min(1, event.velocity / 127));

    synthRef.current.triggerAttackRelease(
      freq,
      Math.max(0.08, duration * 0.92),
      time,
      velocity
    );

    const msUntilNote = Math.max(0, (time - Tone.now()) * 1000);
    const onTimer = setTimeout(() => {
      setActiveNote(safePitch);
      const offTimer = setTimeout(() => setActiveNote(null), 120);
      scheduledVisualTimersRef.current.push(offTimer);
    }, msUntilNote);
    scheduledVisualTimersRef.current.push(onTimer);

    currentTimeRef.current = time + step;
    setNotes((prev) => [...prev, safePitch]);
    recentPlayedNotesRef.current = [
      ...recentPlayedNotesRef.current,
      safePitch,
    ].slice(-48);

    if (bufferRef.current.length <= STREAM_V3_REFILL_QUEUE_NOTES) {
      requestMoreNotes();
    }

    streamV3PlaybackTimerRef.current = setTimeout(() => {
      streamV3PlaybackTimerRef.current = null;
      playStreamV3Queue();
    }, Math.max(80, step * 1000));
  };

  const handleIncomingNotes = (data) => {
    if (!isGeneratingRef.current) return;

    const incomingEvents = normalizeNoteEvents(data);

    if (incomingEvents.length === 0) {
      setError("Invalid notes received from server");
      return;
    }

    if (startupFallbackTimeoutRef.current) {
      clearTimeout(startupFallbackTimeoutRef.current);
      startupFallbackTimeoutRef.current = null;
    }
    clearPendingFallbackTimer();

    expectedChunkSizeRef.current =
      incomingEvents.length || expectedChunkSizeRef.current;

    const incomingPitches = incomingEvents.map((event) => event.pitch);
    serverNoteMemoryRef.current = [
      ...serverNoteMemoryRef.current,
      ...incomingPitches,
    ].slice(-96);
    serverEventMemoryRef.current = [
      ...serverEventMemoryRef.current,
      ...incomingEvents,
    ].slice(-96);

    bufferRef.current.push(...incomingEvents);

    if (isStreamV3Selected()) {
      if (!hasStartedPlaybackRef.current) {
        const neededNotes = getInitialBufferChunks() * expectedChunkSizeRef.current;

        if (bufferRef.current.length >= neededNotes) {
          hasStartedPlaybackRef.current = true;
          currentTimeRef.current = Tone.now() + 0.03;
          setLoading(false);
          playStreamV3Queue();
        } else {
          setLoading(true);
          requestMoreNotes();
        }
      } else {
        setLoading(false);
        if (bufferRef.current.length <= STREAM_V3_REFILL_QUEUE_NOTES) {
          requestMoreNotes();
        }
        playStreamV3Queue();
      }
      return;
    }

    if (!hasStartedPlaybackRef.current) {
      const neededNotes = getInitialBufferChunks() * expectedChunkSizeRef.current;

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
  };

  const startPlaybackFromFallback = () => {
    if (!isGeneratingRef.current || hasStartedPlaybackRef.current) return;
    if (isStreamV3Selected()) return;

    const fallbackEvents = generateFallbackEvents(FALLBACK_BATCH_SIZE);
    if (!fallbackEvents.length) return;

    bufferRef.current.push(...fallbackEvents);
    hasStartedPlaybackRef.current = true;
    currentTimeRef.current = Tone.now() + 0.15;
    setLoading(false);
    playFromBuffer();
    requestMoreNotes({ force: true });
  };

  const scheduleFallbackIfNeeded = () => {
    if (!isGeneratingRef.current) return;
    if (!hasStartedPlaybackRef.current) return;
    if (selectedModelRef.current.type !== "stream") return;
    if (isStreamV3Selected()) return;
    if (bufferRef.current.length >= MIN_BUFFER_NOTES) return;
    if (fallbackTimeoutRef.current) return;

    const now = Tone.now();
    const remainingSeconds = Math.max(0, currentTimeRef.current - now);
    const triggerMs = Math.max(180, remainingSeconds * 1000 - 260);

    fallbackTimeoutRef.current = setTimeout(() => {
      fallbackTimeoutRef.current = null;

      if (!isGeneratingRef.current) return;
      if (bufferRef.current.length >= MIN_BUFFER_NOTES) return;

      const fallbackEvents = generateFallbackEvents(FALLBACK_BATCH_SIZE);
      if (!fallbackEvents.length) return;

      bufferRef.current.push(...fallbackEvents);
      playFromBuffer();
    }, triggerMs);
  };

  const requestMoreNotes = (options = {}) => {
    if (!isGeneratingRef.current) return;
    if (selectedModelRef.current.type !== "stream") return;
    if (!socketRef.current?.connected) return;
    if (requestInFlightRef.current && !options.force) return;

    requestInFlightRef.current = true;
    socketRef.current.emit("request_more", {
      user_text: latestPromptRef.current,
      emotion: getCurrentEmotion(),
      chunk_size: SERVER_CHUNK_SIZE_HINT,
      temperature: getStreamTemperature(),
    });
  };

  const playFromBuffer = (options = {}) => {
    const continueStream = options.continueStream !== false;
    if (!synthRef.current || bufferRef.current.length === 0) return;
    if (isStreamV3Selected()) {
      playStreamV3Queue();
      return;
    }

    const eventsToPlay = [...bufferRef.current];
    const now = Tone.now();

    if (currentTimeRef.current === 0 || currentTimeRef.current < now + 0.08) {
      currentTimeRef.current = now + 0.12;
    }

    let offset = 0;

    eventsToPlay.forEach((event) => {
      const safePitch = clampMidi(event.pitch);
      const freq = 440 * Math.pow(2, (safePitch - 69) / 12);
      const duration = getPlaybackDuration(event);
      const time = currentTimeRef.current + offset;
      const velocity = Math.max(0.2, Math.min(1, event.velocity / 127));

      synthRef.current.triggerAttackRelease(
        freq,
        Math.max(0.08, duration * 0.92),
        time,
        velocity
      );

      const msUntilNote = Math.max(0, (time - Tone.now()) * 1000);
      const onTimer = setTimeout(() => {
        setActiveNote(safePitch);
        const offTimer = setTimeout(() => setActiveNote(null), 120);
        scheduledVisualTimersRef.current.push(offTimer);
      }, msUntilNote);
      scheduledVisualTimersRef.current.push(onTimer);

      offset += getPlaybackStep(event);
    });

    currentTimeRef.current += offset;

    const playedPitches = eventsToPlay.map((event) => clampMidi(event.pitch));
    setNotes((prev) => [...prev, ...playedPitches]);

    recentPlayedNotesRef.current = [
      ...recentPlayedNotesRef.current,
      ...playedPitches,
    ].slice(-48);

    bufferRef.current = [];

    if (!continueStream) {
      playbackEndTimeoutRef.current = setTimeout(() => {
        isGeneratingRef.current = false;
      }, Math.max(1000, (currentTimeRef.current - Tone.now() + 0.5) * 1000));
      return;
    }

    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    requestTimeoutRef.current = setTimeout(() => {
      requestTimeoutRef.current = null;
      requestMoreNotes();
      scheduleFallbackIfNeeded();
    }, Math.max(250, offset * 1000 * 0.45));

    scheduleFallbackIfNeeded();
  };

  const generateSongClip = async (detectedEmotion, cleanPrompt) => {
    setModelStatus("composing");

    const response = await fetch(`${selectedModelRef.current.url}/generate-song`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emotion: detectedEmotion || getCurrentEmotion(),
        prompt: cleanPrompt,
        events: selectedModelRef.current.events || 512,
        temperature: SONG_TEMPERATURE,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Full-song generation failed");
    }

    const generatedEvents = normalizeNoteEvents(data);
    if (!generatedEvents.length) {
      throw new Error("The full-song model did not return playable notes");
    }

    bufferRef.current.push(...generatedEvents);
    hasStartedPlaybackRef.current = true;
    currentTimeRef.current = Tone.now() + 0.2;
    setLoading(false);
    setModelStatus("idle");
    playFromBuffer({ continueStream: false });
  };

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    setLoading(true);
    setError(null);
    resetPlaybackState();
    clearTimers();

    latestPromptRef.current = cleanPrompt;
    isGeneratingRef.current = false;

    try {
      await initializeSynth();

      const detectedEmotion =
        detectedPromptRef.current === cleanPrompt
          ? detectedEmotionRef.current
          : await detectPromptEmotion(cleanPrompt, { silent: true });

      isGeneratingRef.current = true;

      if (selectedModelRef.current.type === "song") {
        await generateSongClip(detectedEmotion, cleanPrompt);
        return;
      }

      if (!socketRef.current?.connected) {
        throw new Error(`${selectedModelRef.current.title} is not connected yet`);
      }

      socketRef.current.emit("start_music", {
        user_text: cleanPrompt,
        emotion: detectedEmotion || getCurrentEmotion(),
        chunk_size: SERVER_CHUNK_SIZE_HINT,
        temperature: getStreamTemperature(),
      });

      if (!isStreamV3Selected()) {
        startupFallbackTimeoutRef.current = setTimeout(
          startPlaybackFromFallback,
          STARTUP_FALLBACK_MS
        );
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "Could not start music generation");
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handlePromptChange = (e) => {
    const newText = e.target.value;
    setPrompt(newText);
    latestPromptRef.current = newText;
    if (isListening) speechBasePromptRef.current = newText.trim();
  };

  const toggleSpeechInput = () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setSpeechStatus("Voice input is unavailable in this browser.");
      return;
    }

    if (isListening) {
      speechStopRequestedRef.current = true;
      shouldKeepListeningRef.current = false;
      clearSpeechRestartTimer();

      try {
        recognition.stop();
      } catch {
        setIsListening(false);
        commitSpeechTranscript();
      }
      return;
    }

    speechBasePromptRef.current = prompt.trim();
    lastSpeechTranscriptRef.current = "";
    recognitionHadErrorRef.current = false;
    speechStopRequestedRef.current = false;
    shouldKeepListeningRef.current = true;
    setSpeechStatus("");
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      shouldKeepListeningRef.current = false;
      setIsListening(false);
      if (err.name !== "InvalidStateError") {
        setSpeechStatus("Voice input could not start.");
      }
    }
  };

  const handleModelSelect = (modelId) => {
    if (modelId === selectedModelId) return;
    stopMusic();
    setError(null);
    setSelectedModelId(modelId);
  };

  const pageBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e0f5f2" : "#1f2a7a";
  const mutedText = theme === "dark" ? "#b8cbc8" : "#5060a2";
  const inputBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const inputBorder = theme === "dark" ? "#2f2f2f" : "#d0e0ff";
  const panelBg =
    theme === "dark" ? "rgba(38, 38, 38, 0.88)" : "rgba(255, 255, 255, 0.86)";
  const selectedPanelBg =
    theme === "dark" ? "rgba(45, 55, 72, 0.94)" : "rgba(236, 246, 255, 0.96)";
  const cardBorder = theme === "dark" ? "#333f4f" : "#cfe3ff";

  const emotionStatusText = {
    waiting: "Reading prompt after you pause...",
    detecting: "Detecting emotion...",
    ready: "Emotion ready",
    offline: "Emotion detector unavailable; music server will infer it",
  }[emotionStatus];

  const SelectedIcon = selectedModel.icon;
  const modelStatusText =
    selectedModel.type === "stream"
      ? statusLabels[modelStatus]
      : loading
        ? statusLabels.composing
        : "Ready to compose";
  const streamModelNotReady =
    selectedModel.type === "stream" && modelStatus !== "connected";

  return (
    <div style={{ backgroundColor: pageBg, color: textColor, minHeight: "100vh" }}>
      <Header />

      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
            style={{
              backgroundColor: theme === "dark" ? "#22322f" : "#e7fbf8",
              color: theme === "dark" ? "#9ff4e8" : "#11746c",
            }}
          >
            <Sparkles size={16} />
            Emotion-aware generation lab
          </div>

          <h2 style={{ color: titleColor }} className="text-4xl sm:text-5xl font-bold mb-4">
            AI Music Therapy Generator
          </h2>

          <p className="text-base sm:text-lg" style={{ color: mutedText }}>
            Choose a generation model, describe how you feel, and let the music adapt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {MODEL_OPTIONS.map((model) => {
            const Icon = model.icon;
            const selected = selectedModelId === model.id;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleModelSelect(model.id)}
                className="text-left rounded-lg p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: selected ? selectedPanelBg : panelBg,
                  border: `1px solid ${selected ? model.accent : cardBorder}`,
                  boxShadow: selected
                    ? `0 14px 34px ${model.accent}24`
                    : "0 8px 24px rgba(31, 42, 122, 0.08)",
                  transform: selected ? "translateY(-2px)" : "translateY(0)",
                  color: textColor,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span
                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${model.accent}1f`,
                      color: model.accent,
                    }}
                  >
                    <Icon size={22} />
                  </span>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: selected ? `${model.accent}22` : inputBg,
                      color: selected ? model.accent : mutedText,
                    }}
                  >
                    {model.eyebrow}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{model.title}</h3>
                  {selected && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: model.accent }}
                    />
                  )}
                </div>
                <p className="text-sm font-semibold mb-2" style={{ color: model.accent }}>
                  {model.mode}
                </p>
                <p className="text-sm leading-relaxed min-h-[64px]" style={{ color: mutedText }}>
                  {model.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  <Gauge size={15} style={{ color: model.accent }} />
                  <span>{model.stat}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-lg p-4 sm:p-6 mb-6"
          style={{
            backgroundColor: panelBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: "0 10px 30px rgba(31, 42, 122, 0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-5">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${selectedModel.accent}1f`,
                color: selectedModel.accent,
              }}
            >
              <SelectedIcon size={24} />
            </div>

            <div className="flex-1 text-left">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold">{selectedModel.title}</h3>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${selectedModel.accent}20`,
                    color: selectedModel.accent,
                  }}
                >
                  <Activity size={13} />
                  {modelStatusText}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: mutedText }}>
                {selectedModel.description}
              </p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Describe how you feel..."
            className="w-full p-4 rounded-lg mb-3 text-lg outline-none transition-shadow"
            style={{
              backgroundColor: inputBg,
              border: `1px solid ${inputBorder}`,
              color: textColor,
              minHeight: "130px",
              resize: "vertical",
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="min-h-[20px] text-sm" style={{ color: mutedText }}>
              {speechStatus}
            </div>
            <button
              type="button"
              onClick={toggleSpeechInput}
              disabled={!speechSupported}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isListening ? "#ef4444" : `${selectedModel.accent}1f`,
                color: isListening ? "#fff" : selectedModel.accent,
                border: `1px solid ${isListening ? "#ef4444" : selectedModel.accent}`,
              }}
              title={
                speechSupported
                  ? isListening
                    ? "Stop voice input"
                    : "Start voice input"
                  : "Voice input is unavailable in this browser"
              }
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              {isListening ? "Stop Voice" : "Voice"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-h-[22px] text-sm" style={{ color: mutedText }}>
              {emotionStatusText}
              {emotion && (
                <span className="ml-2 font-semibold" style={{ color: "#4fd1c5" }}>
                  {emotion}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || streamModelNotReady}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: selectedModel.accent,
                  boxShadow: `0 10px 22px ${selectedModel.accent}35`,
                }}
              >
                <Waves size={18} />
                {loading
                  ? selectedModel.type === "song"
                    ? "Composing..."
                    : "Buffering..."
                  : selectedModel.type === "song"
                    ? "Compose Clip"
                    : streamModelNotReady
                      ? "Connecting..."
                    : "Start Music"}
              </button>

              <button
                onClick={stopMusic}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                <Square size={16} fill="currentColor" />
                Stop
              </button>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-3 sm:p-5 overflow-hidden"
          style={{
            backgroundColor: panelBg,
            border: `1px solid ${cardBorder}`,
          }}
        >
          <PianoRoll notes={notes} emotion={emotion} />
          <PianoKeyboard activeNote={activeNote} emotion={emotion} />
        </div>

        {error && (
          <p className="mt-4 text-sm sm:text-base text-red-500 text-center font-semibold">
            {error}
          </p>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default GenerateMusicPage;
