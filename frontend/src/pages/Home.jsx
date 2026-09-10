import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Destinations from "./Destinations";
import "../styles/Home.css";

function Home() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/destinations?page=1&limit=6")
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

        {loading && <p className="loading">Loading destinations...</p>}

        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && (
        <div className="destination-grid">
          {destinations.map((destination) => (
            <Link
              to={`/destinations/${destination.id}`}
              className="destination-card"
              key={destination.id}
            >
              <span className="destination-category">
                {destination.category}
              </span>

              <h3>{destination.name}</h3>

              <p className="destination-location">
                📍 {destination.location}
              </p>

              <p>{destination.description}</p>

              <div className="destination-details">
                <p>
                  <strong>Cost:</strong> ₹{destination.estimated_cost}
                </p>

                <p>
                  <strong>Best time:</strong>{" "}
                  {destination.best_time_to_visit}
                </p>
              </div>
            </Link>
          ))}
        </div>
        )}

        <div className="view-all">
          <Link to="/destinations">
            View all destinations →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;