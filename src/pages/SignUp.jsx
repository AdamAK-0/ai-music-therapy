import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../apiConfig.js";

import Title from "../components/Title.jsx";
import Box from "../components/Box.jsx";
import InputField from "../components/InputField.jsx";
import Checkbox from "../components/Checkbox.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import BottomText from "../components/BottomText.jsx";
import Footer from "../components/Footer.jsx";

export default function SignUp() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bgColor = theme === "dark" ? "#1e1e1e" : "#fff8f0";
  const textColor = theme === "dark" ? "#ddd" : "#444";

  // redirect if authenticated
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
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agree) return;
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // send signup request to backend
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed.");
        return;
      }

      setUser(data.user);

      window.alert("Account created successfully!");
      navigate("/home");
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <Title
        heading="Enjoy Music with AI"
        subheading="Sign up to generate music, download them, and keep your mood cool."
      />

      <Box>
        <form className="w-full" onSubmit={handleSubmit}>
          <InputField
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
          />

          <InputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
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
          />

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <Checkbox checked={agree} onChange={setAgree} />

          <PrimaryButton
            text={loading ? "Signing up..." : "Sign up for free"}
            disabled={
              loading || !agree || !name.trim() || !email.trim() || !password
            }
            type="submit"
          />

          <BottomText
            textBefore="Already have an account?"
            linkHref="/log-in"
            linkText="Log in"
          />
        </form>
      </Box>

      <Footer theme={theme} />
    </div>
  );
}
