import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-blue-500/20 shadow-lg shadow-blue-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
            <Logo />
            <span className="text-xl font-bold text-white">SafeVoice Admin</span>
          </Link>

          {/* Center: Nav Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/")
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-md hover:shadow-blue-500/20"
              }`}
            >
              Data
            </Link>
            <Link
              to="/analytics"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/analytics")
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-md hover:shadow-blue-500/20"
              }`}
            >
              Analytics
            </Link>
            <Link
              to="/actions"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive("/actions")
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-md hover:shadow-blue-500/20"
              }`}
            >
              Actions
            </Link>
          </div>

          {/* Right: User Info (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-slate-400">Logged in as</span>
            <span className="text-sm font-semibold text-white">Admin</span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-slate-400">Logged in as</span>
              <span className="text-sm font-semibold text-white">Admin</span>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-white transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Mobile Dropdown Menu */}
              <div
                className={`absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl shadow-blue-500/20 overflow-hidden transition-all duration-300 ease-in-out ${
                  isMenuOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="py-2">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive("/")
                        ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-400"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:shadow-blue-500/20"
                    }`}
                  >
                    Data
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive("/analytics")
                        ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-400"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:shadow-blue-500/20"
                    }`}
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/actions"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive("/actions")
                        ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-400"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:shadow-blue-500/20"
                    }`}
                  >
                    Actions
                  </Link>
                  <div className="border-t border-slate-700 mt-2 pt-2 px-4">
                    <span className="text-xs text-slate-400">Logged in as</span>
                    <span className="block text-sm font-semibold text-white mt-1">Admin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

