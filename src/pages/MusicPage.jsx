/*import Navbar from "../components/Navbar";*/
import Footer from "../components/Footer";
import MusicCard from "../components/MusicCard"; // adapted from Card
import Header from "../components/Header";
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../apiConfig";

const emotions = [
  { name: "Calming", image: "https://via.placeholder.com/150/8FD3C8/FFFFFF?text=Calming" },
  { name: "Stress Relief", image: "https://via.placeholder.com/150/FFB6B6/FFFFFF?text=Stress" },
  { name: "Focus", image: "https://via.placeholder.com/150/5B6CFF/FFFFFF?text=Focus" },
  { name: "Uplifting", image: "https://via.placeholder.com/150/FFD700/FFFFFF?text=Uplifting" },
  { name: "Expressive", image: "https://via.placeholder.com/150/FF69B4/FFFFFF?text=Expressive" },
];

const MusicPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme(); 
  const queryParams = new URLSearchParams(location.search);
  const categoryFromURL = queryParams.get("category");

  const [musics, setMusics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Fetch all music from backend
  useEffect(() => {
    async function fetchMusics() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/musics`);
        const data = await response.json();
        setMusics(data);
      } catch (err) {
        console.error("Failed to fetch musics:", err);
        setMusics([]);
      }
    }
    fetchMusics();
  }, []);

  // Handle category from URL
  useEffect(() => {
    if (categoryFromURL) setSelectedCategory(categoryFromURL);
    else setSelectedCategory("All");
  }, [categoryFromURL]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Category selection
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (cat === "All") navigate("/musics");
    else navigate(`/musics?category=${cat}`);
  };

  // Filter music by search + category
  const filteredMusics = musics.filter((music) => {
    const matchesCategory =
      selectedCategory === "All" || music.emotion === selectedCategory;
    const matchesSearch = music.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Suggestions
  const suggestions = musics
    .filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        searchTerm.length > 0;
      const matchesCategory =
        selectedCategory === "All" || m.emotion === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .slice(0, 5);

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  // Music page theme colors — consistent with FeaturedMusic
  const pageBg = theme === "dark" ? "#1a1a1a" : "#fffdf9"; // overall page bg
  const titleColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a"; // heading
  const textColor = theme === "dark" ? "#e0f5f2" : "#1f2a7a";  // text
  const inputBg = theme === "dark" ? "#262626" : "#e5f0ff";     // search input
  const inputBorder = theme === "dark" ? "#2f2f2f" : "#d0e0ff"; // input border
  const suggestionHover = theme === "dark" ? "#343434" : "#c0dfff"; // hover suggestion

  return (
    <div style={{ backgroundColor: pageBg, color: textColor, minHeight: "100vh" }}>
      <Header />
      <section className="px-6 py-12 text-center">
        <h2 className="text-3xl font-bold mb-10" style={{ color: titleColor }}>
          All Music Tracks
        </h2>

        {/* Search Bar */}
        <div className="flex justify-center mb-6" ref={searchRef}>
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-2.5 w-5 h-5"
              style={{ color: theme === "dark" ? "#c8f9f2" : "#1f2a7a" }}
            />
            <input
              type="text"
              placeholder="Search music..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2"
              style={{
                backgroundColor: inputBg,
                borderColor: inputBorder,
                borderStyle: "solid",
                color: textColor,
              }}
            />

            {showSuggestions && suggestions.length > 0 && (
              <ul
                className="absolute left-0 right-0 mt-1 rounded-lg shadow-md z-10"
                style={{ backgroundColor: inputBg, borderColor: inputBorder, borderStyle: "solid" }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => handleSuggestionClick(s.title)}
                    className="px-4 py-2 text-left cursor-pointer hover:opacity-80"
                    style={{ color: textColor, backgroundColor: "transparent" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = suggestionHover)}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Emotion Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {["All", ...emotions.map(e => e.name)].map((cat) => (
           <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className="
                px-4
                py-2
                rounded-full
                text-sm
                font-medium
                border
                cursor-pointer
                transform
                transition-all
                duration-200
                hover:scale-105
              "
              style={{
                backgroundColor:
                  selectedCategory === cat
                    ? theme === "dark"
                      ? "#33f0e0" // dark teal highlight
                      : "#1f2a7a" // light blue
                    : "transparent",
                color:
                  selectedCategory === cat
                    ? theme === "dark"
                      ? "#1a1a1a"
                      : "#fff"
                    : textColor,
                borderColor: inputBorder,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Music Grid */}
        {filteredMusics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMusics.map((music) => (
              <MusicCard
                key={music.title}
                music={music}
                id={encodeURIComponent(music.title)}
                theme={theme} 
              />
            ))}
          </div>
        ) : (
          <p className="text-lg mt-8" style={{ color: textColor }}>
            No music tracks found matching your search.
          </p>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default MusicPage;
