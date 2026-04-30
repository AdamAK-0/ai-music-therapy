// apiConfig.js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://ai-music-therapy-backend.onrender.com/api";
export const API_PYTHON_URL =
  import.meta.env.VITE_MUSIC_SERVER_URL ||
  "https://ai-music-therapy-server.onrender.com";
export const API_MUSIC_SERVER2_URL =
  import.meta.env.VITE_MUSIC_SERVER2_URL || "https://ai-music-therapy-server2.onrender.com";
export const API_EMOTION_URL =
  import.meta.env.VITE_EMOTION_URL || "https://ai-music-therapy-emotiondetection.onrender.com";
