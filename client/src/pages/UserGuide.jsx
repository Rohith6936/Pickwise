// finalworking/p6/client/src/pages/UserGuide.jsx
import React from "react";
import { FaCompass, FaFilm, FaMusic, FaBookOpen, FaUserFriends, FaMagic } from "react-icons/fa";

function UserGuide() {
  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">User Guide</h1>
        <p className="hero-subtitle">
          Learn how to make the most of PickWise. Follow these simple steps to explore
          movies, music, and books tailored to you.
        </p>
      </div>

      <div className="content-card">
        <h2 className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaCompass /> Getting Started
        </h2>
        <ol className="mt-4" style={{ textAlign: 'left', lineHeight: 1.8 }}>
          <li>Sign up or log in to your account.</li>
          <li>Go to <strong>Choose</strong> and select a category: Movies, Music, or Books.</li>
          <li>Set your <strong>Preferences</strong> to personalize recommendations.</li>
        </ol>
      </div>

      <div className="content-card">
        <h3 className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaFilm /> Movies · <FaMusic /> Music · <FaBookOpen /> Books
        </h3>
        <p className="mt-4">
          Navigate between categories anytime. Your saved settings and history keep your experience consistent.
        </p>
      </div>

      <div className="content-card">
        <h3 className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaUserFriends /> Blend Feature
        </h3>
        <p className="mt-4" style={{ textAlign: 'left' }}>
          "User sends a request to another person with an artist name. If accepted, both users can view combined recommendations."
        </p>
        <ol className="mt-4" style={{ textAlign: 'left', lineHeight: 1.8 }}>
          <li>Open the <strong>Blend</strong> section.</li>
          <li>Enter an <strong>Artist Name</strong> to start the blend.</li>
          <li>Send a request to another user.</li>
          <li>Once accepted, both of you will receive <strong>combined suggestions</strong> influenced by the selected artist.</li>
        </ol>
      </div>

      <div className="content-card">
        <h3 className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMagic /> Tips
        </h3>
        <ul className="mt-4" style={{ textAlign: 'left', lineHeight: 1.8 }}>
          <li>Use the <strong>Why This?</strong> section to understand recommendations.</li>
          <li>Update <strong>Preferences</strong> often for better personalization.</li>
          <li>Save favorites and revisit them in your dashboard.</li>
        </ul>
      </div>
    </div>
  );
}

export default UserGuide;