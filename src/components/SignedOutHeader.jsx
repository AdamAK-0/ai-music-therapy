import React, { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import logo from "../assets/ai-music-logo.png";

export default function SignedOutHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Match SignedInHeader colors for music theme
  const bgColor = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const textColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a";
  const linkHoverColor = theme === "dark" ? "#33f0e0" : "#1f2a7a"; // teal/blue music accent
  const signUpBg = theme === "dark" ? "#1f2a7a" : "#1f2a7a"; // brand accent
  const signUpHoverBg = theme === "dark" ? "#0d1a3a" : "#0d1a3a";  

  // Updated menu links
  const menuLinks = [
    { name: "Home", href: "/" },
    { name: "Music", href: "/musics" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm transition-colors duration-300"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <nav className="py-4 px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="AI Music logo" className="w-10 h-10" />
              <span className="text-xl font-bold">AI Music</span>
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

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden"
              >
                {menuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>

          {/* DESKTOP MENU */}
          <ul className="hidden md:flex flex-wrap justify-center md:justify-end mt-3 md:mt-0 space-x-4 text-sm font-medium">
            {menuLinks.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="relative px-1 py-0.5 transition-colors duration-200 hover:opacity-80"
                  style={{ color: textColor }}
                >
                  {item.name}
                  <span
                    className="absolute left-0 -bottom-1 w-0 h-[2px] transition-all duration-200"
                    style={{ backgroundColor: linkHoverColor }}
                  />
                </Link>
              </li>
            ))}

            <li className="ml-3">
              <Link
                to="/sign-up"
                className="px-3 py-1.5 rounded-md transition-colors duration-200"
                style={{
                  backgroundColor: signUpBg,
                  color: "#fff",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = signUpHoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = signUpBg)
                }
              >
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div
            className="md:hidden shadow-inner flex flex-col items-center py-4 space-y-4 text-base font-medium transition-colors duration-300"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {menuLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className="transition-opacity duration-200 hover:opacity-80"
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/sign-up"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-1.5 rounded-md transition-colors duration-200"
              style={{
                backgroundColor: signUpBg,
                color: "#fff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = signUpHoverBg)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = signUpBg)
              }
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>

      <div className="h-[70px] md:h-[76px] -mt-px"></div>
    </>
  );
}
