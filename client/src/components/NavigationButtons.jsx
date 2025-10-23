// src/components/NavigationButtons.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

function NavigationButtons() {
  const navigate = useNavigate();
  const location = useLocation();

  // Routes where Navigation Buttons are hidden
  const hiddenRoutes = ["/", "/login", "/signup"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ✅ Handle Back Button
  const handleBack = () => {
    if (user && location.pathname === "/choose") {
      // User is on /choose and logged in
      // Prevent going back to login/signup pages
      const prevUrl = document.referrer;
      if (prevUrl && (prevUrl.includes("/login") || prevUrl.includes("/signup"))) {
        // Instead of going back, stay on /choose or go to /home
        navigate("/Choose", { replace: true });
        return;
      }
    }
    // Normal back behavior
    navigate(-1);
  };

  // ✅ Handle Forward Button (same as browser forward)
  const handleNext = () => {
    navigate(1);
  };

  return (
    <div className="nav-fab" aria-label="page navigation">
      <button
        className="fab-btn fab-secondary"
        onClick={handleBack}
        aria-label="Go back"
        title="Back"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        className="fab-btn fab-primary"
        onClick={handleNext}
        aria-label="Go forward"
        title="Next"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

export default NavigationButtons;
