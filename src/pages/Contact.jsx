import React from "react";
import Title from "../components/Title.jsx";
import Box from "../components/Box.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import { useTheme } from "../context/ThemeContext";

export default function Contact() {
  const { theme } = useTheme();

  const sectionBg = theme === "dark" ? "#1a1a1a" : "#fffdf9"; // overall page bg
  const highlightColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a"; // heading
  const textColor = theme === "dark" ? "#e0f5f2" : "#1f2a7a";  // text

  return (
    <>
      <Header />
      <div
        className="min-h-screen flex flex-col pt-10 md:pt-14 transition-colors duration-300"
        style={{ backgroundColor: sectionBg, color: textColor }}
      >
        <Title heading="Contact Us" subheading="We’d love to hear from you." />

        <Box>
          <p className="leading-relaxed mb-4" style={{ color: textColor }}>
            We'd love to hear from you. Whether you have a new idea, feedback
            on the site, or want to collaborate, the AI Music team is here for
            you. We read every message and typically reply within one business
            day.
          </p>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium" style={{ color: highlightColor }}>
                Email:
              </span>{" "}
              <a
                href="mailto:customerservice@aimusic.co"
                className="underline hover:opacity-80 transition"
                style={{ color: textColor }}
              >
                customerservice@aimusic.com
              </a>
            </p>
            <p>
              <span className="font-medium" style={{ color: highlightColor }}>
                Phone (Lebanon):
              </span>{" "}
              <a
                href="tel:+96171234567"
                className="underline hover:opacity-80 transition"
                style={{ color: textColor }}
              >
                +961 70 274 627
              </a>
            </p>
          </div>
        </Box>

        <Footer />
      </div>
    </>
  );
}
