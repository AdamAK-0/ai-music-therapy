import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

import profileIcon from "../../assets/profile-icon.svg";
import uploadIcon from "../../assets/upload-icon.svg";
import { API_BASE_URL } from "../../apiConfig";

function getServerRoot(baseUrl) {
  return baseUrl.replace(/\/api$/, "");
}
export default function ProfileInfoForm() {
  const { theme, showToast } = useTheme();
  const { user, loading, setUser } = useAuth();
  const SERVER_ROOT = getServerRoot(API_BASE_URL);

  const [currentName, setCurrentName] = useState(user?.name || "");
  const [currentEmail, setCurrentEmail] = useState(user?.email || "");
  const [currentAboutMe, setCurrentAboutMe] = useState(user?.aboutMe || "");
  const [profileFile, setProfileFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const [profileImageUrl, setProfileImageUrl] = useState(
    user?.profilePicUrl ? `${SERVER_ROOT}${user.profilePicUrl}` : profileIcon
  );

  useEffect(() => {
    if (user) {
      user.profilePicUrl ? `${SERVER_ROOT}${user.profilePicUrl}` : profileIcon;
      setCurrentName(user.name || "");
      setCurrentEmail(user.email || "");
      setCurrentAboutMe(user.aboutMe || "");
    }
  }, [user]);

  if (loading) {
    return <p>Loading profile information...</p>;
  }

  if (!user) {
    return <p>Error: User data not found. Please log in again.</p>;
  }
  // ------------------------------------------------------------------

  const handlePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImageUrl(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", currentName);
      formData.append("email", currentEmail);
      formData.append("aboutMe", currentAboutMe);

      if (profileFile) {
        formData.append("profilePicture", profileFile);
      }

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        return;
      }

      setUser(data.user);

      setProfileFile(null);
      window.alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Theme-based styles
  const inputBg = theme === "dark" ? "#3a3a3a" : "#f3f3f3";
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const borderColor = theme === "dark" ? "#555" : "#ccc";
  const btnBg = theme === "dark" ? "#7a1f2a" : "#7a1f2a";
  const btnHover = theme === "dark" ? "#5c161f" : "#5c161f";

  const isFormDirty =
    currentName !== user.name ||
    currentEmail !== user.email ||
    currentAboutMe !== user.aboutMe ||
    profileFile !== null;
  const isButtonDisabled = isSubmitting || !isFormDirty;

  return (
    <form
      className="flex flex-col transition-colors"
      style={{ color: textColor }}
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-semibold mb-0" style={{ color: "#7a1f2a" }}>
        Profile
      </h1>
      <p
        className="text-base mb-3"
        style={{ color: theme === "dark" ? "#aaa" : "#666" }}
      >
        Profile information will be displayed on your dashboard.
      </p>

      {/* Profile Picture */}
      <div className="mb-4">
        <label
          htmlFor="imgSelector"
          className="block font-semibold text-lg mb-4"
        >
          Profile Picture
        </label>
        <div className="relative w-20 h-20">
          <img
            src={profileImageUrl}
            alt="Profile Picture"
            className="w-20 h-20 rounded-full object-cover"
          />
          <button
            type="button"
            onClick={handlePictureClick}
            className="absolute bottom-0 right-0 p-0 bg-transparent border-none cursor-pointer z-10"
            disabled={isSubmitting}
          >
            <img src={uploadIcon} alt="Upload Icon" className="w-6 h-6" />
          </button>
          <input
            type="file"
            id="imgSelector"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Username */}
      <div className="mt-5">
        <label htmlFor="username" className="block font-semibold text-lg mb-4">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={currentName}
          onChange={(e) => {
            setCurrentName(e.target.value);
            setError("");
          }}
          className="w-full px-3 py-2 rounded-md text-base focus:outline-none"
          style={{
            backgroundColor: inputBg,
            color: textColor,
            border: `1px solid ${borderColor}`,
          }}
        />
      </div>

      {/* Email */}
      <div className="mt-5">
        <label htmlFor="email" className="block font-semibold text-lg mb-4">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={currentEmail}
          onChange={(e) => {
            setCurrentEmail(e.target.value);
            setError("");
          }}
          className="w-full px-3 py-2 rounded-md text-base focus:outline-none"
          style={{
            backgroundColor: inputBg,
            color: textColor,
            border: `1px solid ${borderColor}`,
          }}
        />
      </div>

      {/* About Me */}
      <div className="mt-5">
        <label htmlFor="aboutMe" className="block font-semibold text-lg mb-4">
          About Me
        </label>
        <textarea
          id="aboutMe"
          value={currentAboutMe}
          onChange={(e) => {
            setCurrentAboutMe(e.target.value);
            setError("");
          }}
          className="w-full px-3 py-2 rounded-md text-base focus:outline-none min-h-[100px] resize-y"
          style={{
            backgroundColor: inputBg,
            color: textColor,
            border: `1px solid ${borderColor}`,
          }}
        />
      </div>

      {/* 🛑 ERROR DISPLAY */}
      {error && <p className="mt-3 text-red-500 font-medium">{error}</p>}

      {/* Save Button */}
      <button
        type="submit"
        disabled={isButtonDisabled}
        className="mt-8 self-end px-6 py-2 rounded-md text-white font-medium text-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: btnBg }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
