import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/Navbar.css";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  const initial = (user?.name || user?.email || "A").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("selectedCategory");
    } catch {}
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">🎬 PickWise</Link>
      </div>
      <div style={{ marginLeft: "auto" }} className="navbar-links">
        <div className="profile" ref={profileRef}>
          <button
            className="avatar-btn"
            aria-label="Profile"
            title={user?.name || user?.email || "Admin"}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <FaUserCircle className="avatar-fallback" />
            <span className="avatar-initial" aria-hidden>
              {initial}
            </span>
          </button>
          {open && (
            <div className="profile-menu" role="menu">
              <button className="menu-item danger" onClick={handleLogout} role="menuitem">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}