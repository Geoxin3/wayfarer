import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Destinations.css";

function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 6;

  useEffect(() => {
    fetchDestinations();
  }, [page]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:8000/destinations?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch destinations");
      }

      const data = await response.json();

      setDestinations(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="destinations-message">
        <p>Loading destinations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="destinations-message error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="destinations-page">
      <header className="destinations-header">
        <span className="destinations-eyebrow">WAYFARER</span>

        <h1>Explore Destinations</h1>

        <p>
          Discover places worth visiting and find the perfect destination
          for your next journey.
        </p>
      </header>

      {destinations.length > 0 ? (
        <section className="destination-list">
          {destinations.map((destination) => (
            <Link
              to={`/destinations/${destination.id}`}
              className="destination-list-card"
              key={destination.id}
            >
              <div className="destination-list-card-top">
                <span className="destination-list-category">
                  {destination.category}
                </span>

                <span className="destination-list-location">
                  📍 {destination.location}
                </span>
              </div>

              <div className="destination-list-card-body">
                <h2>{destination.name}</h2>

                <p className="destination-list-description">
                  {destination.description}
                </p>
              </div>

              <div className="destination-list-card-footer">
                <div className="destination-list-info">
                  <span>Estimated cost</span>
                  <strong>₹{destination.estimated_cost}</strong>
                </div>

                <div className="destination-list-info">
                  <span>Best time</span>
                  <strong>{destination.best_time_to_visit}</strong>
                </div>

                <span className="destination-list-arrow">→</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="destinations-message">
          <p>No destinations found.</p>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Destination pagination">
          <button
            onClick={() => setPage((prev) => prev - 1)}
            disabled={page === 1}
          >
            ← Previous
          </button>

          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}

export default Destinations;