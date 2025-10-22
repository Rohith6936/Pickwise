import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar({ showOnlyLogout = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Load user safely from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userPreferences");
    localStorage.removeItem("selectedCategory");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar glass-navbar">
      {/* 🎬 Logo */}
      <div className="navbar-logo">
        <Link to="/" className="brand">
          🎬 PickWise
        </Link>
      </div>

      {/* 🔒 If only logout should show (for ChooseCategoryPage) */}
      {showOnlyLogout ? (
        <div className="navbar-logout-only">
          {user && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 🌐 Navigation Links */}
          <div className="navbar-links">
            <Link to="/home" className="nav-item">
              Home
            </Link>
            <Link to="/about" className="nav-item">
              About Us
            </Link>
            <Link to="/contact" className="nav-item">
              Contact Us
            </Link>
            <Link to="/guide" className="nav-item">
              User Guide
            </Link>

            {/* 👥 Role-based Links */}
            {user?.role !== "admin" && (
              <Link to="/moodboard" className="nav-item">
                Mood-Based
              </Link>
            )}
            {user?.role === "user" && (
              <Link to="/preferences" className="nav-item">
                Preferences
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className="nav-item">
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* 👤 User Section */}
          <div className="navbar-user">
            {user ? (
              <>
                <span className="user-info">
                  Hi, {user.name || user.email?.split("@")[0] || "User"}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Signup
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}

export default Navbar;
