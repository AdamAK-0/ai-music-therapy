import React, { useEffect, useState } from "react";
import MusicCard from "./MusicCard"; // new component
import { useTheme } from "../context/ThemeContext";

const FeaturedMusic = () => {
  const { theme } = useTheme();
  const [featuredMusic, setFeaturedMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  // Colors
  const sectionBg = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const sectionText = theme === "dark" ? "#c8f9f2" : "#1f2a7a"; // teal/blue for music theme
  const cardBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const cardHover = theme === "dark" ? "#2f2f2f" : "#d0e0ff";

  // Fetch featured music from backend (update URL later)
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("https://your-backend.com/api/music/featured");
        const data = await res.json();
        setFeaturedMusic(data);
      } catch (err) {
        console.error("Failed to fetch featured music:", err);
        setFeaturedMusic([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section
        className="py-14 px-6 text-center"
        style={{ backgroundColor: sectionBg }}
      >
        <h2 className="text-2xl font-bold mb-8" style={{ color: sectionText }}>
          Featured Music
        </h2>
        <p style={{ color: sectionText }}>Loading...</p>
      </section>
    );
  }

  if (!featuredMusic.length) {
    return (
      <section
        className="py-14 px-6 text-center"
        style={{ backgroundColor: sectionBg }}
      >
        <h2 className="text-2xl font-bold mb-8" style={{ color: sectionText }}>
          Featured Music
        </h2>
        <p style={{ color: sectionText }}>No featured music available.</p>
      </section>
    );
  }

  return (
    <section
      className="py-14 px-6 text-center"
      style={{ backgroundColor: sectionBg }}
    >
      <h2 className="text-2xl font-bold mb-8" style={{ color: sectionText }}>
        Featured Music
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {featuredMusic.map((music, i) => (
          <div
            key={i}
            className="rounded-lg shadow cursor-pointer transition duration-300 hover:shadow-lg h-full"
          >
            <MusicCard music={music} theme={theme} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedMusic;
