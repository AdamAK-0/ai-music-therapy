import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig";

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

  const API_ROOT = API_BASE_URL.replace(/\/api$/, "");
  const buildImageUrl = (imgPath) =>
    !imgPath ? "" : imgPath.startsWith("http") ? imgPath : `${API_ROOT}${imgPath}`;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const decoded = decodeURIComponent(id);

        const r = await fetch(`${API_BASE_URL}/musics/${encodeURIComponent(decoded)}`);
        if (r.ok) setMusic(await r.json());

        const all = await fetch(`${API_BASE_URL}/musics`);
        if (all.ok) setAllMusics(await all.json());

        const c = await fetch(`${API_BASE_URL}/comments/${encodeURIComponent(decoded)}`);
        if (c.ok) setComments(await c.json());
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    load();
  }, [id]);

  const isOwner = user && music && user.email === music.ownerEmail;

  // IMAGE LIST (album covers or visuals)
  const imageList = [];
  if (music?.cover) imageList.push(music.cover);
  if (Array.isArray(music?.images))
    music.images.forEach((img) => img && !imageList.includes(img) && imageList.push(img));

  const mainImageUrl = buildImageUrl(imageList[0]);

  const similarMusics = allMusics
    .filter((m) => m.title !== music?.title && m.emotion === music?.emotion)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const sectionBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const cardBg = theme === "dark" ? "#2a2a2a" : "#ffffff";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e0f5f2" : "#444";

  // SAVE
  const handleSave = async () => {
    if (!user)
      return Swal.fire({ icon: "info", title: "Log in to save tracks" });

    const res = await fetch(
      `${API_BASE_URL}/favorites/${encodeURIComponent(music.title)}`,
      { method: "POST", credentials: "include" }
    );

    if (!res.ok) return Swal.fire({ icon: "error", title: "Error saving track" });
    Swal.fire({ icon: "success", title: "Saved!" });
    navigate("/favorites");
  };

  // SHARE
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: music.title, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      Swal.fire({ icon: "success", title: "Link copied!" });
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!isOwner) return;

    Swal.fire({
      icon: "warning",
      title: "Delete this track?",
      showCancelButton: true,
      confirmButtonColor: "#7a1f2a",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const res = await fetch(
        `${API_BASE_URL}/musics/${encodeURIComponent(music.title)}`,
        { method: "DELETE", credentials: "include" }
      );

      if (!res.ok) return Swal.fire({ icon: "error", title: "Failed to delete" });

      Swal.fire({ icon: "success", title: "Track deleted" });
      navigate("/musics");
    });
  };

  // FEEDBACK
  const submitFeedback = async () => {
    if (!user) return Swal.fire({ icon: "info", title: "Log in to comment" });
    if (!feedback && rating === 0)
      return Swal.fire({ icon: "warning", title: "Add rating or comment" });

    const res = await fetch(`${API_BASE_URL}/comments/${music.title}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: feedback }),
    });

    const data = await res.json();
    if (!res.ok)
      return Swal.fire({ icon: "error", title: data.error || "Error" });

    if (data.comment)
      setComments((prev) => [data.comment, ...prev].slice(0, 6));

    setRating(0);
    setFeedback("");
    Swal.fire({ icon: "success", title: "Thank you!" });
  };

  if (authLoading || loading || !music) {
    return (
      <>
        <Header />
        <section className="py-24 min-h-screen flex justify-center items-center">
          <h2 className="text-3xl font-semibold">Loading track…</h2>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative h-[60vh] sm:h-[65vh] overflow-hidden">
        <img src={mainImageUrl} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f2a7a]/75 to-transparent dark:from-[#33f0e0]/75" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-bold mb-2">{music.title}</h1>
          {music.emotion && (
            <span className="mb-3 px-4 py-1 text-sm rounded-full bg-white/20 border border-white/40">
              {music.emotion}
            </span>
          )}
          <p className="max-w-2xl text-lg sm:text-xl opacity-90">{music.description}</p>
        </div>
      </section>

      {/* AUDIO PLAYER */}
      <section className="py-12 px-6" style={{ backgroundColor: sectionBg }}>
        <div className="max-w-3xl mx-auto text-center">
          <audio
            controls
            src={music.audioUrl.startsWith("http") ? music.audioUrl : `${API_ROOT}${music.audioUrl}`}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* WHY THIS TRACK HELPS */}
      {music.whyLove && (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6" style={{ color: titleColor }}>
              Why This Music Helps
            </h2>
            <p className="text-lg" style={{ color: textColor }}>{music.whyLove}</p>
          </div>
        </section>
      )}

      {/* SIMILAR TRACKS */}
      {similarMusics.length > 0 && (
        <section className="py-20 px-6 text-center" style={{ backgroundColor: sectionBg }}>
          <h2 className="text-3xl font-bold mb-12" style={{ color: titleColor }}>
            Discover Similar Tracks
          </h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
            {similarMusics.map((sim, i) => (
              <div
                key={i}
                onClick={() => navigate(`/music/${encodeURIComponent(sim.title)}`)}
                className="rounded-xl shadow hover:scale-105 transition overflow-hidden cursor-pointer"
                style={{ backgroundColor: cardBg }}
              >
                <img src={buildImageUrl(sim.cover)} className="w-full h-48 object-cover" />
                <div className="py-4 font-semibold text-lg" style={{ color: titleColor }}>
                  {sim.title}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEEDBACK SECTION */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: sectionBg }}>
        <h2 className="text-3xl font-bold mb-10" style={{ color: titleColor }}>
          Community Love
        </h2>

        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {comments.length === 0 ? (
            <p className="text-lg" style={{ color: textColor }}>No feedback yet.</p>
          ) : (
            comments.slice(0, showAllComments ? 6 : 3).map((c, i) => (
              <div
                key={i}
                className="max-w-xs p-6 rounded-xl shadow"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                <div className="flex justify-center text-xl mb-2">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= c.rating ? "text-[#FFD700]" : "text-gray-300"}>★</span>
                  ))}
                </div>
                {c.comment && <p className="italic text-base">“{c.comment}”</p>}
                {c.createdAt && (
                  <p className="mt-3 text-xs opacity-70">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {comments.length > 3 && (
          <button
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-sm underline mb-10"
            style={{ color: titleColor }}
          >
            {showAllComments ? "Show Less" : "Show More"}
          </button>
        )}

        {user && (
          <div
            className="max-w-md mx-auto p-6 rounded-xl shadow"
            style={{ backgroundColor: cardBg }}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: titleColor }}>
              Share your thoughts ✍️
            </h3>

            <div className="flex justify-center mb-4">
              {[1,2,3,4,5].map((star) => (
                <span
                  key={star}
                  className={`cursor-pointer text-3xl ${star <= rating ? "text-[#FFD700]" : "text-gray-300"}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              className="w-full p-3 rounded-lg border h-28 text-base"
              placeholder="Write something…"
              style={{ backgroundColor: cardBg, color: textColor, borderColor: "#ccc" }}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <button
              onClick={submitFeedback}
              className="px-6 py-2 mt-5 rounded-lg text-white"
              style={{ backgroundColor: "#7a1f2a" }}
            >
              Submit
            </button>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default MusicDetails;
