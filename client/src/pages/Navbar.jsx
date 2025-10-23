// finalworking/p6/client/src/pages/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { FaUserCircle } from "react-icons/fa";

function Navbar({ showOnlyLogout = false, hideHome = false, hideMood = false, hidePreferences = false, hideProfile = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage safely
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
    navigate("/login", { replace: true });
  };

  // Profile menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const userInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();
  const fmt = (v) => {
    try {
      const d = new Date(v);
      if (!isNaN(d)) return d.toLocaleString();
    } catch {}
    return String(v);
  };

  // ✅ If no user logged in, still show minimal Navbar
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">🎬 PickWise</Link>
      </div>

      {showOnlyLogout ? (
        <div className="navbar-logout-only">
          {user && !hideProfile && (
            <div className="profile" ref={profileRef}>
              <button
                className="avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={user?.name || user?.email || "Account"}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="avatar-img" />
                ) : (
                  <FaUserCircle className="avatar-fallback" />
                )}
                <span className="avatar-initial" aria-hidden>
                  {!user?.avatar ? userInitial : null}
                </span>
              </button>
              {menuOpen && (
                <div className="profile-menu" role="menu">
                  <div className="profile-header">
                    <div className="profile-name">{user?.name || "User"}</div>
                    {user?.email && <div className="profile-email">{user.email}</div>}
                    {user?.role && <div className="profile-role">Role: {user.role}</div>}
                  </div>
                  {user?.username && <div className="menu-info">Username: {user.username}</div>}
                  {user?.plan && <div className="menu-info">Plan: {user.plan}</div>}
                  {user?.createdAt && <div className="menu-info">Joined: {fmt(user.createdAt)}</div>}
                  {user?.lastLogin && <div className="menu-info">Last login: {fmt(user.lastLogin)}</div>}
                  <Link to="/books/wishlist" className="menu-item" onClick={() => setMenuOpen(false)} role="menuitem">Saved Lists</Link>
                  <Link to="/dashboard" className="menu-item" onClick={() => setMenuOpen(false)} role="menuitem">Dashboard</Link>
                  <button className="menu-item danger" onClick={handleLogout} role="menuitem">Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // ✅ Full Navbar (visible to both users & admins)
        <div className="navbar-links">
          {!hideHome && <Link to="/home">Home</Link>}
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/guide">User Guide</Link>

          {/* 🚫 Hide Mood-Based for Admins */}
          {!hideMood && user?.role !== "admin" && <Link to="/moodboard">Mood-Based</Link>}

          {/* 👤 User-only link */}
          {user && user.role === "user" && !hidePreferences && (
            <Link to="/preferences">Preferences</Link>
          )}

          {/* Admin-only link */}
          {user && user.role === "admin" && (
            <Link to="/admin">Admin Dashboard</Link>
          )}

          {user && !hideProfile && (
            <div className="profile" ref={profileRef}>
              <button
                className="avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={user?.name || user?.email || "Account"}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="avatar-img" />
                ) : (
                  <FaUserCircle className="avatar-fallback" />
                )}
                <span className="avatar-initial" aria-hidden>
                  {!user?.avatar ? userInitial : null}
                </span>
              </button>
              {menuOpen && (
                <div className="profile-menu" role="menu">
                  <div className="profile-header">
                    <div className="profile-name">{user?.name || "User"}</div>
                    {user?.email && <div className="profile-email">{user.email}</div>}
                    {user?.role && <div className="profile-role">Role: {user.role}</div>}
                  </div>
                  {user?.username && <div className="menu-info">Username: {user.username}</div>}
                  {user?.plan && <div className="menu-info">Plan: {user.plan}</div>}
                  {user?.createdAt && <div className="menu-info">Joined: {fmt(user.createdAt)}</div>}
                  {user?.lastLogin && <div className="menu-info">Last login: {fmt(user.lastLogin)}</div>}
                  <Link to="/books/wishlist" className="menu-item" onClick={() => setMenuOpen(false)} role="menuitem">Saved Lists</Link>
                  <Link to="/dashboard" className="menu-item" onClick={() => setMenuOpen(false)} role="menuitem">Dashboard</Link>
                  <button className="menu-item danger" onClick={handleLogout} role="menuitem">Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;