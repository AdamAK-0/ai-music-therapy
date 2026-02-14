import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig";
import FavImage from "../assets/top-image.png";

function FavoriteMusics() {
  const [favorites, setFavorites] = useState([]);
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* 🔗 IMAGE URL BUILDER */
  const API_ROOT = API_BASE_URL.replace(/\/api$/, "");
  const buildImageUrl = (imgPath) => {
    if (!imgPath) return "";
    if (imgPath.startsWith("http")) return imgPath;
    return `${API_ROOT}${imgPath}`;
  };

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (location.pathname !== "/log-in") {
        Swal.fire({
          icon: "info",
          title: "You must log in first",
          confirmButtonColor: "#1f2a7a",
        });
        navigate("/log-in");
      }
    }
  }, [authLoading, user, location.pathname, navigate]);

  /* ⭐ LOAD FAVORITES */
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const loadFavorites = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/favorites`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const favoriteTitles = await res.json();

        const musicPromises = favoriteTitles.map(async (fav) => {
          const r = await fetch(
            `${API_BASE_URL}/musics/${encodeURIComponent(fav.title)}`
          );
          return r.ok ? r.json() : null;
        });

        const fullMusics = (await Promise.all(musicPromises)).filter(Boolean);
        setFavorites(fullMusics);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    loadFavorites();
  }, [authLoading, user]);

  /* ❌ REMOVE FROM FAVORITES */
  const handleDelete = async (title) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/favorites/${encodeURIComponent(title)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Could not remove music",
          confirmButtonColor: "#1f2a7a",
        });
        return;
      }

      setFavorites((prev) => prev.filter((item) => item.title !== title));

      Swal.fire({
        icon: "success",
        title: "Removed!",
        text: "Music removed from favorites",
        confirmButtonColor: "#1f2a7a",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Failed to remove music",
        confirmButtonColor: "#1f2a7a",
      });
    }
  };

  const handleCardClick = (title) => {
    navigate(`/music/${encodeURIComponent(title)}`);
  };

  /* 🎨 MUSIC THEME */
  const sectionBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const cardBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";

  if (authLoading) return null;

  return (
    <>
      <Header />

      {/* 🎧 HERO */}
      <section
        className="relative py-16 px-6 text-center overflow-hidden"
        style={{ backgroundColor: sectionBg }}
      >
        <img
          src={FavImage}
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          alt=""
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ color: titleColor }}>
            Your Favorite Music
          </h1>
          <p className="text-lg" style={{ color: textColor }}>
            The tracks that support your mood and mind
          </p>
        </div>
      </section>

      {/* 🎶 CONTENT */}
      <section
        className="py-16 px-6 min-h-screen"
        style={{ backgroundColor: sectionBg }}
      >
        {favorites.length === 0 ? (
          <p className="text-center text-lg" style={{ color: textColor }}>
            No saved music yet — discover your sound ✨
          </p>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {favorites.map((music, i) => (
              <div
                key={i}
                onClick={() => handleCardClick(music.title)}
                className="rounded-2xl shadow-lg hover:shadow-xl cursor-pointer overflow-hidden group flex flex-col h-full"
                style={{ backgroundColor: cardBg }}
              >
                {music.cover && (
                  <img
                    src={buildImageUrl(music.cover)}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    alt=""
                  />
                )}

                <div className="p-5 flex flex-col flex-grow">
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ color: titleColor }}
                  >
                    {music.title}
                  </h3>

                  <p
                    className="text-sm mb-4 flex-grow"
                    style={{ color: textColor }}
                  >
                    {music.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(music.title);
                    }}
                    className="px-4 py-2 rounded-lg w-full text-sm"
                    style={{ backgroundColor: "#1f2a7a", color: "#fff" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default FavoriteMusics;
