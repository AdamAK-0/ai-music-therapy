import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import trashIcon from "../../assets/trash-icon.svg";

export default function DangerZoneSection() {
  const { theme, showToast } = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone."
    );

    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete account.");
      }

      setUser(null);

      alert("Your account has been successfully deleted.");

      navigate("/");
    } catch (error) {
      console.error("Account Deletion Error:", error);
      alert(`Could not delete account. Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

// Theme-based colors (Music Therapy)
const sectionBg = theme === "dark" ? "#1a1f2b" : "#fffdf9";      // deep calm blue / soft off-white
const sectionBorder = theme === "dark" ? "#2e3a4d" : "#dde4f0"; // subtle blue-gray
const textColor = theme === "dark" ? "#e0f5f2" : "#444";        // soft readable
const subTextColor = theme === "dark" ? "#9fbfbc" : "#666";     // muted calm text

// Danger buttons (keep noticeable but not aggressive)
const dangerBtnBg = "#7a1f2a";                                  // same red tone
const dangerBtnHover = "#5c161f";
const btnDisabledBg = theme === "dark" ? "#3a3f4d" : "#cfd6e3"; // neutral disabled


  return (
    <section
      className="flex flex-col rounded-xl p-4 md:p-8 shadow-sm transition-colors"
      style={{
        backgroundColor: sectionBg,
        border: `1px solid ${sectionBorder}`,
        color: textColor,
      }}
    >
      <h1 className="text-2xl font-semibold mb-0" style={{ color: "#7a1f2a" }}>
        Danger Zone
      </h1>
      <p className="text-base mb-6" style={{ color: subTextColor }}>
        Careful, these actions cannot be undone.
      </p>

      {/* Delete Account Button */}
      <button
        onClick={handleDeleteAccount}
        disabled={isDeleting}
        className="flex items-center gap-4 w-[200px] px-3 py-2 mb-4 rounded-md font-medium text-base transition-colors cursor-pointer disabled:opacity-70"
        style={{
          color: "#fff",
          backgroundColor: isDeleting ? btnDisabledBg : dangerBtnBg, // Change color when loading
          border: `1px solid ${dangerBtnBg}`,
        }}
        onMouseEnter={(e) =>
          !isDeleting &&
          (e.currentTarget.style.backgroundColor = dangerBtnHover)
        }
        onMouseLeave={(e) =>
          !isDeleting && (e.currentTarget.style.backgroundColor = dangerBtnBg)
        }
      >
        <img src={trashIcon} alt="Delete Account Icon" width={25} height={25} />
        <p className="m-0 flex-grow text-left">
          {isDeleting ? "Deleting..." : "Delete Account"}
        </p>
      </button>
    </section>
  );
}
