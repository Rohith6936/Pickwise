// finalworking/p6/client/src/components/NavigationButtons.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

function NavigationButtons() {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenRoutes = ["/", "/login", "/signup"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  return (
    <div className="nav-fab" aria-label="page navigation">
      <button
        className="fab-btn fab-secondary"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        title="Back"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        className="fab-btn fab-primary"
        onClick={() => navigate(1)}
        aria-label="Go forward"
        title="Next"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

export default NavigationButtons;