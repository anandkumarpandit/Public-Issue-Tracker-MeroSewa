import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAdminAuthenticated } from "../services/apiClient";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());

    const handleStorage = () => setIsAdmin(isAdminAuthenticated());
    window.addEventListener("storage", handleStorage);
    window.addEventListener("authChanged", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("authChanged", handleStorage);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* LOGO */}
        <Link to="/" className="logo" onClick={closeMenu}>
          🏛️ MeroSewa
        </Link>

        {/* DESKTOP NAV */}
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/submit">Submit Complaint</Link>
          <Link to="/track">Track Complaint</Link>
          <Link to="/qr-info">QR Info</Link>

          {/* ADMIN SECTION (Logout removed) */}
          {isAdmin ? (
            <Link to="/admin">Admin</Link>
          ) : (
            <Link to="/admin/login">Admin Login</Link>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu();
          }}
          className="mobile-menu-btn"
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
          type="button"
        >
          {isMenuOpen ? (
            <svg
              className="hamburger-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="hamburger-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div
          className="mobile-menu-container menu-open"
          onClick={(e) => {
            if (
              e.target.classList.contains("mobile-overlay") ||
              e.target.classList.contains("mobile-menu-container")
            ) {
              closeMenu();
            }
          }}
        >
          <div className="mobile-overlay overlay-visible" onClick={closeMenu} />

          {/* SIDEBAR */}
          <div
            className="mobile-sidebar sidebar-open"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sidebar-header">
              <Link to="/" className="logo mobile-logo" onClick={closeMenu}>
                🏛️ MeroSewa
              </Link>

              {/* CLOSE BTN */}
              <button onClick={closeMenu} className="close-menu-btn">
                <svg
                  className="hamburger-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* MOBILE NAV LINKS */}
            <nav className="mobile-nav" style={{ flex: 1, overflowY: "auto" }}>
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
                onClick={closeMenu}
              >
                🏠 Home
              </Link>

              <Link
                to="/submit"
                className={location.pathname === "/submit" ? "active" : ""}
                onClick={closeMenu}
              >
                Submit Complaint
              </Link>

              <Link
                to="/track"
                className={location.pathname === "/track" ? "active" : ""}
                onClick={closeMenu}
              >
                🔍 Track Complaint
              </Link>

              <Link
                to="/qr-info"
                className={location.pathname === "/qr-info" ? "active" : ""}
                onClick={closeMenu}
              >
                📱 QR Info
              </Link>

              {/* ADMIN (NO LOGOUT IN MOBILE TOO) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={location.pathname === "/admin" ? "active" : ""}
                  onClick={closeMenu}
                >
                  ⚙️ Admin
                </Link>
              )}

              {!isAdmin && (
                <Link
                  to="/admin/login"
                  className={
                    location.pathname === "/admin/login" ? "active" : ""
                  }
                  onClick={closeMenu}
                >
                  🔐 Admin Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
