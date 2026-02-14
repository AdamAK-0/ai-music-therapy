import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../apiConfig.js";
import { useAuth } from "../context/AuthContext";

import Title from "../components/Title.jsx";
import Box from "../components/Box.jsx";
import InputField from "../components/InputField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import BottomText from "../components/BottomText.jsx";
import Footer from "../components/Footer.jsx";

export default function LogIn() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bgColor = theme === "dark" ? "#1a1a1a" : "#f5f7fa";


  // backend root
  const API_ROOT = API_BASE_URL.replace("/api", "");

  // redirect if logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/check`, {
          credentials: "include", // include cookies so backend can read jwt
        });

        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated) navigate("/home");
      } catch {}
    };

    checkAuth();
  }, [navigate, API_ROOT]); // FIXED

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Both fields are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      setUser(data.user);
      window.alert(`Welcome back, ${data.user.name}!`);
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: bgColor }}
    >
      <Title
        heading="Welcome back"
        subheading="Log in to access your favorite musics and enjoy them."
      />

      <Box theme={theme}>
        <form className="w-full" onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            theme={theme}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            theme={theme}
          />

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <PrimaryButton
            text={loading ? "Logging in..." : "Log in"}
            type="submit"
            disabled={loading || !email || !password}
            theme={theme}
          />

          <BottomText
            textBefore="Don’t have an account?"
            linkHref="/sign-up"
            linkText="Sign up"
            theme={theme}
          />
        </form>
      </Box>

      <Footer theme={theme} />
    </div>
  );
}
