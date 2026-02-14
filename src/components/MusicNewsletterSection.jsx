import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../apiConfig";

const MusicNewsletterSection = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // "success", "error", or ""

  // Section-specific colors
  const sectionBg = theme === "dark" ? "#1f1f1f" : "#f0f8ff"; 
  const headingColor = theme === "dark" ? "#80e0ff" : "#1f4aa0";
  const textColor = theme === "dark" ? "#c0f2f1" : "#1a1f4a";
  const inputBg = theme === "dark" ? "#2a2a2a" : "#fff";
  const inputBorder = theme === "dark" ? "#1f4aa0" : "#ccc";
  const inputText = theme === "dark" ? "#c0f2f1" : "#1a1f4a";
  const buttonBg = theme === "dark" ? "#1f4aa0" : "#1f4aa0";
  const buttonHover = theme === "dark" ? "#3f7acc" : "#3f7acc";

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        console.error(data.error);
      }
    } catch (err) {
      setStatus("error");
      console.error(err);
    }
  };

  return (
    <section
      className="py-14 px-6 text-center transition-colors duration-300"
      style={{ backgroundColor: sectionBg }}
    >
      <h2
        className="text-2xl font-bold mb-4 transition-colors duration-300"
        style={{ color: headingColor }}
      >
        Join Our Music Community
      </h2>
      <p
        className="mb-6 transition-colors duration-300"
        style={{ color: textColor }}
      >
        Get the latest AI-generated music, playlists, and mood tracks delivered to your inbox.
      </p>
      <form
        onSubmit={handleSubscribe}
        className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          placeholder="Enter your email for music updates"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-full px-4 py-2 w-full sm:w-2/3 transition-colors duration-300"
          style={{
            backgroundColor: inputBg,
            borderColor: inputBorder,
            color: inputText,
          }}
        />
        <button
          type="submit"
          className="px-6 py-2 rounded-full transition-colors duration-300"
          style={{ 
            backgroundColor: buttonBg, 
            color: "#fff",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = buttonBg)}
        >
          Subscribe
        </button>
      </form>

      {status === "success" && (
        <p className="mt-4" style={{ color: "green" }}>
          Thank you for subscribing!
        </p>
      )}
      {status === "error" && (
        <p className="mt-4" style={{ color: "red" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </section>
  );
};

export default MusicNewsletterSection;
