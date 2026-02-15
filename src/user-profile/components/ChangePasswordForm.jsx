import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../apiConfig";
import eyeOpenIcon from "../../assets/eye-open.svg";
import eyeClosedIcon from "../../assets/eye-closed.svg";

export default function ChangePasswordForm() {
  const { theme } = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (setter) => {
    setter((prev) => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError("All password fields are required.");
    }

    if (newPassword.length < 12) {
      return setError("New password must be at least 12 characters long.");
    }

    if (newPassword !== confirmPassword) {
      return setError("New Password and Confirm Password do not match.");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password update failed.");
      }

      setSuccess(data.message);

      setUser(null);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/log-in");
      }, 2000);
    } catch (err) {
      console.error("Password Change Error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

// Theme-based colors (Music Therapy)
const bgColor = theme === "dark" ? "#1a1a1a" : "#fffdf9";      // section background
const borderColor = theme === "dark" ? "#2f3a3a" : "#dde8e6"; // soft teal border
const textColor = theme === "dark" ? "#e0f5f2" : "#444";      // calm readable text
const btnColor = "#1f2a7a";                                  // deep calming blue
const btnHover = "#16205c";                                  // darker hover


  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col rounded-xl p-4 md:p-8 shadow-sm transition-colors`}
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <h1 className="text-2xl font-semibold mb-2 text-[#1f2a7a]">
        Change Your Password
      </h1>

      {/* Feedback Messages */}
      {error && (
        <p className="text-red-500 font-medium my-3 p-2 border border-red-500 rounded-md bg-red-100 dark:bg-red-900/50">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 font-medium my-3 p-2 border border-green-600 rounded-md bg-green-100 dark:bg-green-900/50">
          {success} (Redirecting to login...)
        </p>
      )}

      {/* Current Password */}
      <div className="mt-5">
        <label
          htmlFor="currentPassword"
          className={`block font-semibold text-lg mb-3`}
          style={{ color: textColor }}
        >
          Current Password
        </label>
        <div
          className="flex items-center w-full rounded-md transition-colors"
          style={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <input
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-transparent text-base focus:outline-none"
            style={{ color: textColor }}
          />
          <span
            className="cursor-pointer pr-3 flex items-center justify-center text-current"
            onClick={() => togglePasswordVisibility(setShowCurrentPassword)}
          >
            {/* Using img tag with imported SVG path */}
            <img
              src={showCurrentPassword ? eyeOpenIcon : eyeClosedIcon}
              alt="Toggle current password visibility"
              width={28}
              height={28}
            />
          </span>
        </div>
      </div>

      {/* New Password */}
      <div className="mt-5">
        <label
          htmlFor="newPassword"
          className={`block font-semibold text-lg mb-3`}
          style={{ color: textColor }}
        >
          New Password
        </label>
        <div
          className="flex items-center w-full rounded-md transition-colors"
          style={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <input
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-transparent text-base focus:outline-none"
            style={{ color: textColor }}
          />
          <span
            className="cursor-pointer pr-3 flex items-center justify-center text-current"
            onClick={() => togglePasswordVisibility(setShowNewPassword)}
          >
            <img
              src={showNewPassword ? eyeOpenIcon : eyeClosedIcon}
              alt="Toggle new password visibility"
              width={28}
              height={28}
            />
          </span>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mt-5">
        <label
          htmlFor="confirmPassword"
          className={`block font-semibold text-lg mb-3`}
          style={{ color: textColor }}
        >
          Confirm Password
        </label>
        <div
          className="flex items-center w-full rounded-md transition-colors"
          style={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-transparent text-base focus:outline-none"
            style={{ color: textColor }}
          />
          <span
            className="cursor-pointer pr-3 flex items-center justify-center text-current"
            onClick={() => togglePasswordVisibility(setShowConfirmPassword)}
          >
            <img
              src={showConfirmPassword ? eyeOpenIcon : eyeClosedIcon}
              alt="Toggle confirm password visibility"
              width={28}
              height={28}
            />
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 self-end px-6 py-2 rounded-md font-medium text-lg transition-colors cursor-pointer disabled:opacity-50"
        style={{
          backgroundColor: btnColor,
          color: "#fff",
        }}
        onMouseEnter={(e) =>
          !loading && (e.currentTarget.style.backgroundColor = btnHover)
        }
        onMouseLeave={(e) =>
          !loading && (e.currentTarget.style.backgroundColor = btnColor)
        }
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
