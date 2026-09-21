import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrips } from "../services/tripService";
import "../styles/MyTrip.css";

function MyTrips() {
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      setLoading(true);
      setError("");

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const response = await getTrips(userId);

      if (!response.ok) {
        throw new Error("Failed to load trips");
      }

      const data = await response.json();

      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="my-trips-message">
        Loading trips...
      </div>
    );
  }

  return (
    <div className="my-trips-page">
      <header className="my-trips-header">
        <span className="my-trips-eyebrow">WAYFARER</span>

        <h1>My Trips</h1>

        <p>
          View the trips you have planned.
        </p>

        {trips.length > 0 && (
          <button
            type="button"
            className="plan-trip-button"
            onClick={() => navigate("/trips/plan")}
          >
            Plan a Trip →
          </button>
        )}
      </header>

      {error && (
        <div className="my-trips-error">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="my-trips-empty">
          <h2>No trips planned yet</h2>

          <p>
            Start planning your next journey with Wayfarer.
          </p>

          <button
            type="button"
            className="plan-trip-button"
            onClick={() => navigate("/trips/plan")}
          >
            Plan a Trip →
          </button>
        </div>
      ) : (
        <section className="my-trips-list">
          {trips.map((trip) => (
            <article
              className="my-trip-card"
              key={trip.id}
            >
              <div className="my-trip-card-header">
                <div>
                  <h2>{trip.name}</h2>

                  <p>
                    {trip.start_date} → {trip.end_date}
                  </p>
                </div>

                <span className="my-trip-count">
                  {trip.destinations.length} destination
                  {trip.destinations.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="my-trip-destinations">
                {trip.destinations.length === 0 ? (
                  <p className="no-destinations">
                    No destinations selected yet.
                  </p>
                ) : (
                  trip.destinations.map((destination) => (
                    <div
                      className="my-trip-destination"
                      key={destination.id}
                    >
                      <strong>{destination.name}</strong>

                      <span>
                        📍 {destination.location}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="my-trip-card-footer">
                <span>
                  Trip #{trip.id}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/trips/${trip.id}`)
                  }
                >
                  View Trip →
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default MyTrips;