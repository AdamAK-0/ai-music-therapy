import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Image, Images, Music, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig";
import { authFetch } from "../authToken";

const API_ROOT = API_BASE_URL.replace(/\/api$/, "");
const buildUrl = (p) =>
  !p ? "" : p.startsWith("http") ? p : `${API_ROOT}${p}`;
const isUploadedMediaUrl = (value) =>
  Boolean(value) &&
  (value.startsWith("/uploads/") || value.startsWith(`${API_ROOT}/uploads/`));
const getFileNameFromUrl = (value, fallback) => {
  try {
    const pathname = value.startsWith("http") ? new URL(value).pathname : value;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || fallback);
  } catch {
    return fallback;
  }
};

const fetchUploadedMediaAsFile = async (value, fallbackName) => {
  const response = await fetch(buildUrl(value));
  if (!response.ok) {
    throw new Error("Could not reuse the current uploaded media. Please upload a replacement file.");
  }

  const blob = await response.blob();
  return new File([blob], getFileNameFromUrl(value, fallbackName), {
    type: blob.type || "application/octet-stream",
  });
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.error || data.message || "Save failed";
  } catch {
    return "Save failed";
  }
};

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
  const [existingCoverPath, setExistingCoverPath] = useState("");
  const [existingImagePaths, setExistingImagePaths] = useState([]);

  const emotions = [
    "Calming",
    "Stress Relief",
    "Focus",
    "Uplifting",
    "Expressive",
  ];

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
        const res = await authFetch(
          `${API_BASE_URL}/music/${encodeURIComponent(editingTitle)}`
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
        setExistingCoverPath(data.cover || "");
        setExistingImagePaths(Array.isArray(data.images) ? data.images : []);

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
      const makeFormData = async ({ includeExistingUploads = false } = {}) => {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        fd.append("emotion", emotion);
        fd.append("whyLove", whyLove);
        fd.append("audioUrl", audioUrl);

        if (audioFile) {
          fd.append("audio", audioFile);
        } else if (
          includeExistingUploads &&
          editingTitle &&
          isUploadedMediaUrl(audioUrl)
        ) {
          fd.append(
            "audio",
            await fetchUploadedMediaAsFile(audioUrl, "current-audio.mp3")
          );
        }

        if (coverFile) {
          fd.append("cover", coverFile);
        } else if (
          includeExistingUploads &&
          editingTitle &&
          isUploadedMediaUrl(existingCoverPath)
        ) {
          fd.append(
            "cover",
            await fetchUploadedMediaAsFile(existingCoverPath, "current-cover.jpg")
          );
        }

        if (extraImages.length > 0) {
          extraImages.forEach((img) => fd.append("images", img));
        } else if (includeExistingUploads && editingTitle) {
          const reusableImages = existingImagePaths.filter(isUploadedMediaUrl);
          const files = await Promise.all(
            reusableImages.map((img, index) =>
              fetchUploadedMediaAsFile(img, `current-gallery-${index + 1}.jpg`)
            )
          );
          files.forEach((img) => fd.append("images", img));
        }

        return fd;
      };

      const endpoint = editingTitle
        ? `${API_BASE_URL}/music/${encodeURIComponent(editingTitle)}`
        : `${API_BASE_URL}/music`;
      const method = editingTitle ? "PUT" : "POST";
      let requestBody = null;
      let usedExistingUploads = false;

      if (editingTitle) {
        try {
          requestBody = await makeFormData({ includeExistingUploads: true });
          usedExistingUploads = true;
        } catch (reuseErr) {
          console.warn("Could not reuse existing uploaded media:", reuseErr);
          requestBody = await makeFormData();
        }
      } else {
        requestBody = await makeFormData();
      }

      let res = await authFetch(endpoint, {
        method,
        body: requestBody,
      });

      if (editingTitle && res.status >= 500 && !usedExistingUploads) {
        res = await authFetch(endpoint, {
          method,
          body: await makeFormData({ includeExistingUploads: true }),
        });
      }

      if (!res.ok) throw new Error(await getErrorMessage(res));

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
  const mutedText = theme === "dark" ? "#b8cbc8" : "#5060a2";
  const uploadBg = theme === "dark" ? "#222" : "#f8fbff";
  const uploadBorder = theme === "dark" ? "#4a5568" : "#b7c9f4";
  const uploadAccentBg = theme === "dark" ? "#183533" : "#dff8f4";
  const uploadAccentText = theme === "dark" ? "#8ef2e5" : "#11746c";

  const uploadButtonStyle = {
    backgroundColor: sectionText,
    color: "#fff",
  };

  const renderUploadField = ({
    id,
    label,
    helper,
    accept,
    multiple = false,
    onChange,
    icon,
    fileText,
    preview,
    previews = [],
  }) => (
    <div
      className="rounded-lg border border-dashed p-4"
      style={{ backgroundColor: uploadBg, borderColor: uploadBorder }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: uploadAccentBg, color: uploadAccentText }}
        >
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          <label
            htmlFor={id}
            className="block text-base font-bold mb-1"
            style={{ color: sectionText }}
          >
            {label}
          </label>
          <p className="text-sm leading-relaxed" style={{ color: mutedText }}>
            {helper}
          </p>
          {fileText && (
            <p className="text-sm font-semibold mt-2 truncate" style={{ color: inputText }}>
              {fileText}
            </p>
          )}
        </div>

        <label
          htmlFor={id}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold cursor-pointer transition hover:scale-[1.02]"
          style={uploadButtonStyle}
        >
          <Upload size={17} />
          Upload
        </label>

        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="sr-only"
        />
      </div>

      {preview && (
        <img
          src={preview}
          alt="Selected cover preview"
          className="mt-4 h-32 w-full rounded-lg object-cover"
        />
      )}

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={`Selected extra preview ${index + 1}`}
              className="h-20 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );

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

            {renderUploadField({
              id: "audio-upload",
              label: "Music track",
              helper: "Upload the music track users will listen to. Audio files such as MP3, WAV, or M4A work best.",
              accept: "audio/*",
              onChange: handleAudioChange,
              icon: <Music size={23} />,
              fileText: audioFile
                ? audioFile.name
                : editingTitle
                  ? "Keep the current track or upload a replacement."
                  : "",
            })}

            {renderUploadField({
              id: "cover-upload",
              label: "Cover picture",
              helper: "Upload a picture for the music card cover. Use a clear JPG, PNG, or WEBP image.",
              accept: "image/*",
              onChange: handleCoverChange,
              icon: <Image size={23} />,
              fileText: coverFile
                ? coverFile.name
                : coverPreview
                  ? "Current cover picture"
                  : "",
              preview: coverPreview,
            })}

            {renderUploadField({
              id: "extra-images-upload",
              label: "Additional pictures",
              helper: "Upload optional extra pictures for the music details gallery.",
              accept: "image/*",
              multiple: true,
              onChange: handleExtraImages,
              icon: <Images size={23} />,
              fileText:
                extraImages.length > 0
                  ? `${extraImages.length} picture${extraImages.length === 1 ? "" : "s"} selected`
                  : extraPreviews.length > 0
                    ? `${extraPreviews.length} current picture${extraPreviews.length === 1 ? "" : "s"}`
                    : "",
              previews: extraPreviews,
            })}

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
