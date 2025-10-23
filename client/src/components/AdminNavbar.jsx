// src/components/AdminNavbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/Navbar.css";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const profileRef = useRef(null);

  // ✅ Load user safely from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user:", err);
      }
    }
  }, []);

  const userInitial = (user?.name || user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

  // ✅ Close menu on outside click
  useEffect(() => {
    function handleDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // ✅ Logout and redirect to login
  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("selectedCategory");
    } catch (err) {
      console.error("Error clearing localStorage:", err);
    }
    navigate("/login", { replace: true }); // ✅ ensures no back navigation to admin
  };

  return (
    <nav className="navbar admin-navbar">
      {/* 🎬 Brand Logo */}
      <div className="navbar-logo">
        <Link to="/">🎬 PickWise</Link>
      </div>

      {/* 👤 Admin Profile */}
      <div className="navbar-links" style={{ marginLeft: "auto" }}>
        <div className="profile" ref={profileRef}>
          <button
            className="avatar-btn"
            aria-label="Admin Profile"
            title={user?.name || user?.email || "Admin"}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Admin Avatar" className="avatar-img" />
            ) : (
              <FaUserCircle className="avatar-fallback" />
            )}
            <span className="avatar-initial" aria-hidden>
              {!user?.avatar ? userInitial : null}
            </span>
          </button>

          {open && (
            <div className="profile-menu" role="menu">
              <div className="profile-header">
                <div className="profile-name">{user?.name || "Admin"}</div>
                {user?.email && <div className="profile-email">{user.email}</div>}
                <div className="profile-role">Role: Admin</div>
              </div>
              <button
                className="menu-item danger"
                onClick={handleLogout}
                role="menuitem"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
