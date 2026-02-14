import React, { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import logo from "../assets/ai-music-logo.png";
import profilePic from "../assets/profile-placeholder.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../apiConfig";

function getServerRoot(baseUrl) {
  return baseUrl.replace(/\/api$/, "");
}

export default function SignedInHeader({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const SERVER_ROOT = getServerRoot(API_BASE_URL);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const profileImageUrl = user?.profilePicUrl
    ? `${SERVER_ROOT}${user.profilePicUrl}`
    : profilePic;

  // Updated links for music focus
  const links = [
    { name: "Home", href: "/home" },
    { name: "Music", href: "/musics" }, //  -> Music
    { name: "Add Music", href: "/add-music" },
    { name: "Favorites", href: "/favorites" },
    { name: "AI Generator", href: "/ai-generator" },
    { name: "Contact", href: "/contact" },
  ];

  // Theme-based colors
  const bgColor = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const textColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const borderColor = theme === "dark" ? "#33f0e0" : "#1f2a7a"; // brand accent
  const hoverBg = theme === "dark" ? "#262626" : "#e5f0ff";
  const dropdownBg = theme === "dark" ? "#1f1f1f" : "#fffdf9";

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      Swal.fire({
        icon: "error",
        title: "Sign Out Failed",
        text: "We couldn't complete your request. Please check your connection and try again.",
        confirmButtonColor: "#1f2a7a",
      });
    }
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm transition-colors duration-300"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <nav className="py-4 px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AI Music logo" className="w-10 h-10" />
              <span className="text-xl font-semibold">AI Music</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full transition hover:bg-gray-200 dark:hover:bg-gray-300"
              >
                {theme === "light" ? (
                  <Moon className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-400" />
                )}
              </button>

              {/* Mobile Menu Button */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
                {menuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>

          {/* DESKTOP MENU */}
          <ul className="hidden md:flex items-center space-x-4 mt-3 md:mt-0 text-sm font-medium">
            {links.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  style={{ color: textColor }}
                  className="relative px-1 py-0.5 hover:opacity-80 transition-opacity duration-200"
                >
                  {link.name}
                </Link>
              </li>
            ))}

            <li className="relative">
              <button onClick={toggleDropdown} className="p-0">
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full object-cover border-2 hover:scale-105 transition-transform duration-200"
                  style={{ borderColor }}
                  onError={(e) => (e.currentTarget.src = profilePic)}
                />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 rounded-lg shadow-lg p-4 flex flex-col gap-3 min-w-[150px] z-50"
                  style={{ backgroundColor: dropdownBg, color: textColor }}
                >
                  <Link
                    to="/profile/user-info"
                    className="text-base font-medium hover:opacity-80 transition-opacity duration-200"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="text-base font-medium hover:opacity-80 transition-opacity duration-200 text-left"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </li>
          </ul>
        </nav>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div
            className="md:hidden shadow-inner flex flex-col items-center py-4 space-y-4 text-base font-medium"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="hover:opacity-80 transition-opacity duration-200"
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/profile/user-info"
              onClick={() => setMenuOpen(false)}
              className="flex items-center space-x-2 border px-3 py-1.5 rounded-lg hover:opacity-80"
              style={{ borderColor }}
            >
              <img
                src={profileImageUrl}
                alt="Your profile"
                className="w-7 h-7 rounded-full"
                style={{ borderColor }}
              />
              <span>Profile</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="border px-3 py-1.5 rounded-lg text-center w-32"
              style={{ borderColor }}
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[70px] md:h-[76px]"></div>
    </>
  );
}
