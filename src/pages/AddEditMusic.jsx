import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig";

const AddEditMusic = () => {
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const editingTitle = searchParams.get("title");

  // 🎵 FORM STATE
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emotion, setEmotion] = useState("");
  const [whyLove, setWhyLove] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // FILES
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [extraImages, setExtraImages] = useState([]);

  // PREVIEWS
  const [coverPreview, setCoverPreview] = useState("");
  const [extraPreviews, setExtraPreviews] = useState([]);

  const emotions = [
    "Calming",
    "Stress Relief",
    "Focus",
    "Uplifting",
    "Expressive",
  ];

  const API_ROOT = API_BASE_URL.replace(/\/api$/, "");
  const buildUrl = (p) =>
    !p ? "" : p.startsWith("http") ? p : `${API_ROOT}${p}`;

  /* 🔐 AUTH */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Login required",
        text: "Please log in to add or edit music.",
        confirmButtonColor: "#1f2a7a",
      });
      navigate("/log-in");
    }
  }, [authLoading, user, navigate]);

  /* ✏️ LOAD MUSIC (EDIT MODE) */
  useEffect(() => {
    if (!editingTitle || authLoading || !user) return;

    const loadMusic = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/music/${encodeURIComponent(editingTitle)}`,
          { credentials: "include" }
        );
        if (!res.ok) return;

        const data = await res.json();

        if (data.ownerEmail !== user.email) {
          Swal.fire({
            icon: "error",
            title: "Access denied",
            text: "You can only edit your own music.",
            confirmButtonColor: "#1f2a7a",
          });
          navigate("/music");
          return;
        }

        setTitle(data.title || "");
        setDescription(data.description || "");
        setEmotion(data.emotion || "");
        setWhyLove(data.whyLove || "");
        setAudioUrl(data.audioUrl || "");

        setCoverPreview(buildUrl(data.cover));
        setExtraPreviews(
          (data.images || []).map((img) => buildUrl(img))
        );
      } catch (err) {
        console.error(err);
      }
    };

    loadMusic();
  }, [editingTitle, authLoading, user, navigate]);

  /* 📂 FILE HANDLERS */
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
  };

  const handleExtraImages = (e) => {
    const files = Array.from(e.target.files || []);
    setExtraImages(files);
    setExtraPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  /* 💾 SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !emotion || !whyLove) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please fill all required fields.",
        confirmButtonColor: "#1f2a7a",
      });
      return;
    }

    if (!editingTitle && !audioFile && !audioUrl) {
      Swal.fire({
        icon: "warning",
        title: "Audio required",
        text: "Upload an audio file or provide a link.",
        confirmButtonColor: "#1f2a7a",
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("emotion", emotion);
      fd.append("whyLove", whyLove);
      fd.append("audioUrl", audioUrl);

      if (audioFile) fd.append("audio", audioFile);
      if (coverFile) fd.append("cover", coverFile);
      extraImages.forEach((img) => fd.append("images", img));

      const res = await fetch(
        editingTitle
          ? `${API_BASE_URL}/music/${encodeURIComponent(editingTitle)}`
          : `${API_BASE_URL}/music`,
        {
          method: editingTitle ? "PUT" : "POST",
          body: fd,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Save failed");

      Swal.fire({
        icon: "success",
        title: editingTitle ? "Music updated!" : "Music added!",
        confirmButtonColor: "#1f2a7a",
      });

      navigate("/musics");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: "#1f2a7a",
      });
    }
  };

  /* 🎨 MUSIC THEME COLORS */
  const sectionBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const sectionText = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const cardBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const inputBg = theme === "dark" ? "#2f2f2f" : "#ffffff";
  const inputText = theme === "dark" ? "#e5e5e5" : "#333";
  const inputBorder = theme === "dark" ? "#444" : "#1f2a7a";

  if (authLoading) return null;

  return (
    <>
      <Header />

      <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
        <div
          className="max-w-3xl mx-auto rounded-2xl p-8 shadow-lg"
          style={{ backgroundColor: cardBg }}
        >
          <h1
            className="text-3xl font-bold text-center mb-8"
            style={{ color: sectionText }}
          >
            {editingTitle ? "Edit Music" : "Add New Music"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ backgroundColor: inputBg, color: inputText, borderColor: inputBorder }}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 px-4 py-2 rounded-lg border"
              style={{ backgroundColor: inputBg, color: inputText, borderColor: inputBorder }}
            />

            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ backgroundColor: inputBg, color: inputText, borderColor: inputBorder }}
            >
              <option value="">Select emotion</option>
              {emotions.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <textarea
              placeholder="Why this music helps"
              value={whyLove}
              onChange={(e) => setWhyLove(e.target.value)}
              className="w-full h-24 px-4 py-2 rounded-lg border"
              style={{ backgroundColor: inputBg, color: inputText, borderColor: inputBorder }}
            />

            <input
              placeholder="Audio link (optional)"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ backgroundColor: inputBg, color: inputText, borderColor: inputBorder }}
            />

            <input type="file" accept="audio/*" onChange={handleAudioChange} />
            <input type="file" accept="image/*" onChange={handleCoverChange} />
            <input type="file" accept="image/*" multiple onChange={handleExtraImages} />

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
              style={{ backgroundColor: sectionText, color: "#fff" }}
            >
              {editingTitle ? "Update Music" : "Save Music"}
            </button>

          </form>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AddEditMusic;
