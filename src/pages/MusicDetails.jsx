import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  CalendarDays,
  Edit3,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Music2,
  Share2,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig";
import { authFetch } from "../authToken";

const API_ROOT = API_BASE_URL.replace(/\/api$/, "");

const buildMediaUrl = (path) =>
  !path ? "" : path.startsWith("http") ? path : `${API_ROOT}${path}`;

const getImageList = (music) => {
  const sourceImages = [
    music?.cover,
    ...(Array.isArray(music?.images) ? music.images : []),
    ...(Array.isArray(music?.extraImages) ? music.extraImages : []),
  ];

  return sourceImages.filter((img, index, arr) => img && arr.indexOf(img) === index);
};

const formatDate = (value) => {
  if (!value) return "Recently added";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const RatingStars = ({ value = 0, interactive = false, onSelect }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => {
      const active = star <= value;
      const IconWrapper = interactive ? "button" : "span";

      return (
        <IconWrapper
          key={star}
          type={interactive ? "button" : undefined}
          aria-label={interactive ? `Rate ${star} out of 5` : undefined}
          onClick={interactive ? () => onSelect(star) : undefined}
          className={interactive ? "p-1 rounded-md transition hover:scale-110" : ""}
        >
          <Star
            size={interactive ? 25 : 18}
            fill={active ? "#f7c948" : "transparent"}
            color={active ? "#f7c948" : "#b8c2d6"}
          />
        </IconWrapper>
      );
    })}
  </div>
);

function MusicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const [music, setMusic] = useState(null);
  const [allMusics, setAllMusics] = useState([]);
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const decoded = decodeURIComponent(id);

        const musicResponse = await fetch(
          `${API_BASE_URL}/musics/${encodeURIComponent(decoded)}`
        );

        if (musicResponse.ok) {
          const musicData = await musicResponse.json();
          setMusic(musicData);
          setActiveImage(buildMediaUrl(getImageList(musicData)[0]));
        } else {
          setMusic(null);
        }

        const allResponse = await fetch(`${API_BASE_URL}/musics`);
        if (allResponse.ok) setAllMusics(await allResponse.json());

        const commentsResponse = await fetch(
          `${API_BASE_URL}/comments/${encodeURIComponent(decoded)}`
        );
        if (commentsResponse.ok) setComments(await commentsResponse.json());
      } catch (err) {
        console.error("Error loading music details:", err);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    load();
  }, [id]);

  const imageList = useMemo(() => getImageList(music), [music]);
  const galleryImages = imageList.map(buildMediaUrl);
  const heroImage = activeImage || galleryImages[0];
  const audioSrc = buildMediaUrl(music?.audioUrl);
  const isOwner = Boolean(user && music && user.email === music.ownerEmail);
  const displayedComments = comments.slice(0, showAllComments ? comments.length : 3);
  const averageRating = comments.length
    ? comments.reduce((sum, comment) => sum + (Number(comment.rating) || 0), 0) /
      comments.length
    : 0;

  const similarMusics = useMemo(
    () =>
      allMusics
        .filter((item) => item.title !== music?.title && item.emotion === music?.emotion)
        .slice(0, 3),
    [allMusics, music]
  );

  const pageBg = theme === "dark" ? "#151515" : "#fffdf9";
  const cardBg = theme === "dark" ? "#242424" : "#ffffff";
  const softBg = theme === "dark" ? "#1d2827" : "#eef8ff";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e8f6f4" : "#24304f";
  const mutedText = theme === "dark" ? "#aec4c1" : "#61708f";
  const borderColor = theme === "dark" ? "#334240" : "#d5e3f8";
  const accent = theme === "dark" ? "#62e5d8" : "#1f8f86";
  const danger = "#b91c1c";
  const audioPanelBg =
    theme === "dark" ? "rgba(29, 40, 39, 0.88)" : "rgba(255, 255, 255, 0.9)";
  const audioPanelText = theme === "dark" ? "#ffffff" : titleColor;
  const audioPanelMuted = theme === "dark" ? "rgba(255, 255, 255, 0.7)" : mutedText;

  const handleSave = async () => {
    if (!user) {
      return Swal.fire({ icon: "info", title: "Log in to save tracks" });
    }

    const response = await authFetch(
      `${API_BASE_URL}/favorites/${encodeURIComponent(music.title)}`,
      { method: "POST" }
    );

    if (!response.ok) {
      return Swal.fire({ icon: "error", title: "Error saving track" });
    }

    Swal.fire({ icon: "success", title: "Saved!" });
    navigate("/favorites");
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: music.title, url });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    Swal.fire({ icon: "success", title: "Link copied!" });
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this track?",
      text: "This removes the track and its feedback.",
      showCancelButton: true,
      confirmButtonColor: danger,
    });

    if (!result.isConfirmed) return;

    const response = await authFetch(
      `${API_BASE_URL}/musics/${encodeURIComponent(music.title)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      return Swal.fire({ icon: "error", title: "Failed to delete" });
    }

    Swal.fire({ icon: "success", title: "Track deleted" });
    navigate("/musics");
  };

  const submitFeedback = async () => {
    if (!user) return Swal.fire({ icon: "info", title: "Log in to comment" });
    if (!feedback.trim() && rating === 0) {
      return Swal.fire({ icon: "warning", title: "Add rating or comment" });
    }

    const response = await authFetch(
      `${API_BASE_URL}/comments/${encodeURIComponent(music.title)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: feedback.trim() }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return Swal.fire({ icon: "error", title: data.error || "Error" });
    }

    if (data.comment) setComments((prev) => [data.comment, ...prev]);

    setRating(0);
    setFeedback("");
    Swal.fire({ icon: "success", title: "Thank you!" });
  };

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: pageBg, minHeight: "100vh" }}>
        <Header />
        <section className="py-24 min-h-screen flex justify-center items-center">
          <h2 className="text-2xl font-semibold" style={{ color: titleColor }}>
            Loading track...
          </h2>
        </section>
        <Footer />
      </div>
    );
  }

  if (!music) {
    return (
      <div style={{ backgroundColor: pageBg, minHeight: "100vh" }}>
        <Header />
        <section className="py-24 px-6 min-h-screen text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: titleColor }}>
            Track not found
          </h1>
          <button
            type="button"
            onClick={() => navigate("/musics")}
            className="px-5 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: titleColor }}
          >
            Browse Music
          </button>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: pageBg, color: textColor, minHeight: "100vh" }}>
      <Header />

      <section className="relative overflow-hidden">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(56%)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 min-h-[560px] grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-end">
          <div className="text-white pt-16">
            <div className="flex flex-wrap gap-3 mb-5">
              {music.emotion && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-white/15 border border-white/30">
                  <Sparkles size={15} />
                  {music.emotion}
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-white/15 border border-white/30">
                <CalendarDays size={15} />
                {formatDate(music.createdAt || music.updatedAt)}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-5">
              {music.title}
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed max-w-2xl text-white/88">
              {music.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {user && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-white text-[#1f2a7a] transition hover:scale-[1.02]"
                >
                  <Heart size={17} />
                  Save
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border border-white/50 text-white transition hover:bg-white/10"
              >
                <Share2 size={17} />
                Share
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/add-music?title=${encodeURIComponent(music.title)}`)
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border border-white/50 text-white transition hover:bg-white/10"
                  >
                    <Edit3 size={17} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition hover:scale-[1.02]"
                    style={{ backgroundColor: danger }}
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className="rounded-lg p-5 shadow-2xl border"
            style={{
              backgroundColor: audioPanelBg,
              borderColor: "rgba(255,255,255,0.24)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              {heroImage && (
                <img
                  src={heroImage}
                  alt={music.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: audioPanelMuted }}>
                  Now playing
                </p>
                <h2
                  className="text-xl font-bold truncate"
                  style={{ color: audioPanelText }}
                >
                  {music.title}
                </h2>
                <p className="text-sm truncate" style={{ color: audioPanelMuted }}>
                  {music.ownerEmail}
                </p>
              </div>
            </div>
            {audioSrc && (
              <audio controls src={audioSrc} className="w-full rounded-lg" />
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1fr_330px] gap-8">
          <div className="space-y-8">
            {galleryImages.length > 0 && (
              <section>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: titleColor }}>
                    Visual Gallery
                  </h2>
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: mutedText }}>
                    <ImageIcon size={16} />
                    {galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border" style={{ borderColor }}>
                  <img
                    src={heroImage}
                    alt={`${music.title} selected visual`}
                    className="w-full aspect-[16/9] object-cover"
                  />
                </div>

                {galleryImages.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                    {galleryImages.map((img, index) => (
                      <button
                        type="button"
                        key={img}
                        onClick={() => setActiveImage(img)}
                        className="shrink-0 rounded-lg overflow-hidden border-2 transition"
                        style={{
                          borderColor: img === heroImage ? accent : "transparent",
                        }}
                        aria-label={`Show visual ${index + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${music.title} visual ${index + 1}`}
                          className="w-28 h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section
              className="rounded-lg p-6 border"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: softBg, color: accent }}
                >
                  <Music2 size={22} />
                </span>
                <h2 className="text-2xl font-bold" style={{ color: titleColor }}>
                  About This Track
                </h2>
              </div>
              <p className="leading-relaxed text-base sm:text-lg" style={{ color: textColor }}>
                {music.description}
              </p>
            </section>

            {music.whyLove && (
              <section
                className="rounded-lg p-6 border"
                style={{ backgroundColor: softBg, borderColor }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-11 h-11 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cardBg, color: accent }}
                  >
                    <Sparkles size={22} />
                  </span>
                  <h2 className="text-2xl font-bold" style={{ color: titleColor }}>
                    Why This Music Helps
                  </h2>
                </div>
                <p className="leading-relaxed text-base sm:text-lg" style={{ color: textColor }}>
                  {music.whyLove}
                </p>
              </section>
            )}

            <section
              className="rounded-lg p-6 border"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: titleColor }}>
                    Community Love
                  </h2>
                  <p className="text-sm mt-1" style={{ color: mutedText }}>
                    {comments.length
                      ? `${comments.length} response${comments.length === 1 ? "" : "s"}`
                      : "No feedback yet"}
                  </p>
                </div>
                {comments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <RatingStars value={Math.round(averageRating)} />
                    <span className="text-sm font-bold" style={{ color: mutedText }}>
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-7">
                {displayedComments.length === 0 ? (
                  <p className="text-sm" style={{ color: mutedText }}>
                    Be the first to leave a rating or comment.
                  </p>
                ) : (
                  displayedComments.map((comment, index) => (
                    <article
                      key={`${comment.createdAt || "comment"}-${index}`}
                      className="rounded-lg p-4 border"
                      style={{ backgroundColor: softBg, borderColor }}
                    >
                      <RatingStars value={Number(comment.rating) || 0} />
                      {comment.comment && (
                        <p className="mt-3 leading-relaxed" style={{ color: textColor }}>
                          "{comment.comment}"
                        </p>
                      )}
                      <p className="mt-3 text-xs" style={{ color: mutedText }}>
                        {formatDate(comment.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>

              {comments.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllComments((value) => !value)}
                  className="text-sm font-bold mb-7"
                  style={{ color: accent }}
                >
                  {showAllComments ? "Show fewer comments" : "Show all comments"}
                </button>
              )}

              {user && (
                <div className="rounded-lg p-4 border" style={{ borderColor }}>
                  <div className="flex items-center gap-2 mb-3" style={{ color: titleColor }}>
                    <MessageSquare size={18} />
                    <h3 className="font-bold">Share Your Thoughts</h3>
                  </div>
                  <RatingStars value={rating} interactive onSelect={setRating} />
                  <textarea
                    className="w-full mt-4 p-3 rounded-lg border h-28 text-base outline-none"
                    placeholder="Write something..."
                    style={{
                      backgroundColor: pageBg,
                      color: textColor,
                      borderColor,
                    }}
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={submitFeedback}
                    className="px-5 py-2.5 mt-4 rounded-lg text-white font-bold"
                    style={{ backgroundColor: titleColor }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section
              className="rounded-lg p-5 border"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <h2 className="text-xl font-bold mb-5" style={{ color: titleColor }}>
                Track Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} style={{ color: accent }} />
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: mutedText }}>
                      Emotion
                    </p>
                    <p className="font-semibold">{music.emotion || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={18} style={{ color: accent }} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase" style={{ color: mutedText }}>
                      Uploaded By
                    </p>
                    <p className="font-semibold break-words">
                      {music.ownerEmail || "Unknown creator"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays size={18} style={{ color: accent }} />
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: mutedText }}>
                      Added
                    </p>
                    <p className="font-semibold">{formatDate(music.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ImageIcon size={18} style={{ color: accent }} />
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: mutedText }}>
                      Uploaded Pictures
                    </p>
                    <p className="font-semibold">{galleryImages.length}</p>
                  </div>
                </div>
              </div>
            </section>

            {similarMusics.length > 0 && (
              <section
                className="rounded-lg p-5 border"
                style={{ backgroundColor: cardBg, borderColor }}
              >
                <h2 className="text-xl font-bold mb-5" style={{ color: titleColor }}>
                  Similar Tracks
                </h2>
                <div className="space-y-3">
                  {similarMusics.map((item) => {
                    const image = buildMediaUrl(getImageList(item)[0]);

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() =>
                          navigate(`/musics/${encodeURIComponent(item.title)}`)
                        }
                        className="w-full flex items-center gap-3 text-left rounded-lg p-2 transition hover:scale-[1.01]"
                        style={{ backgroundColor: softBg }}
                      >
                        {image && (
                          <img
                            src={image}
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold truncate" style={{ color: titleColor }}>
                            {item.title}
                          </p>
                          <p className="text-sm truncate" style={{ color: mutedText }}>
                            {item.emotion}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MusicDetails;
