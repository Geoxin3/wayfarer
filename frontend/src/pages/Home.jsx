import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  Compass,
  Luggage,
  LogOut,
  MapPin,
  Wallet,
  X,
} from "lucide-react";
import "../styles/Home.css";
import { getDestinations } from "../services/destinationService";

function Home() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutConfirm]);

  useEffect(() => {
    getDestinations(1, 6)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        setDestinations(data.items);
      })
      .catch((err) => {
        console.error("Destination fetch error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page">
      <button
        type="button"
        className="logout-button"
        onClick={() => setShowLogoutConfirm(true)}
      >
        <LogOut size={16} aria-hidden="true" />
        Logout
      </button>

      <section className="hero">
        <span className="destinations-eyebrow">WAYFARER</span>
        <h1>Discover your next adventure.</h1>
        <br></br>
        <p>
          Explore beautiful destinations and find the perfect place
          for your next journey.
        </p>
      </section>

      <section className="destinations-section">
        <div className="section-header">
          <h2>Explore Destinations</h2>
          <p>Find places worth visiting.</p>
        </div>

        <Link to="/trips" className="plan-trip-button">
          <Luggage size={17} aria-hidden="true" />
          <span>Your Trips</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>

        <br></br>
        {loading && <p className="loading">Loading destinations...</p>}

        {error && <p className="error">Error: {error}</p>}
        <br></br>

        {!loading && !error && (
          <div className="destination-grid">
            {destinations.map((destination) => (
              <Link
                to={`/destinations/${destination.id}`}
                className="destination-card"
                key={destination.id}
              >
                <div
                  className="destination-card-image-container"
                  aria-label={`Image area for ${destination.name}`}
                />

                <span className="destination-category">
                  {destination.category}
                </span>

                <h3>{destination.name}</h3>

                <p className="destination-location">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{destination.location}</span>
                </p>

                <p>{destination.description}</p>

                <div className="destination-details">
                  <p>
                    <Wallet size={15} aria-hidden="true" />
                    <span>
                      <strong>Cost:</strong> ₹{destination.estimated_cost}
                    </span>
                  </p>
                  
                  <p>
                    <CalendarDays size={15} aria-hidden="true" />
                    <span>
                      <strong>Best time:</strong>{" "}
                      {destination.best_time_to_visit}
                    </span>
                  </p>

                <p>
                  <CalendarDays size={15} aria-hidden="true" />
                  <span>
                    <strong>Duration:</strong>{" "}
                    {destination.recommended_min_days} - {destination.recommended_max_days} days
                  </span>
                </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="view-all">
          <Link to="/destinations">
            <Compass size={17} aria-hidden="true" />
            <span>View all destinations</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {showLogoutConfirm && (
        <div className="logout-overlay">
          <div
            className="logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <div className="logout-modal-icon" aria-hidden="true">
              <LogOut size={24} />
            </div>

            <h2 id="logout-title">Log out?</h2>

            <p id="logout-description">
              Are you sure you want to log out of Wayfarer?
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={() => setShowLogoutConfirm(false)}
                autoFocus
              >
                <X size={16} aria-hidden="true" />
                Cancel
              </button>

              <button
                type="button"
                className="logout-confirm-button"
                onClick={handleLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;