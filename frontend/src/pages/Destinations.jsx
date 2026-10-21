import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Wallet,
} from "lucide-react";
import "../styles/Destinations.css";
import {
  getDestinations,
  getInterests,
} from "../services/destinationService";

function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 6;

  useEffect(() => {
    fetchDestinations();
  }, [page]);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDestinations(page, limit);

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

  const fetchInterests = async () => {
    try {
      const response = await getInterests();

      if (!response.ok) {
        throw new Error("Failed to fetch interests");
      }

      const data = await response.json();

      setInterests(data);
    } catch (err) {
      console.error("Interest fetch error:", err);
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
              <div
                className="destination-list-image-container"
                aria-label={`Image area for ${destination.name}`}
              />

              <div className="destination-list-card-top">
                <span className="destination-list-category">
                  {destination.category}
                </span>

                <span className="destination-list-location">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{destination.location}</span>
                </span>
              </div>

              <div className="destination-list-card-body">
                <h2>{destination.name}</h2>

                <p className="destination-list-description">
                  {destination.description}
                </p>
              </div>

              {destination.interest_ids?.length > 0 && (
                <div className="destination-interests">
                  {destination.interest_ids.map((interestId) => {
                    const interest = interests.find(
                      (item) => item.id === interestId
                    );

                    return interest ? (
                      <span key={interest.id} className="interest-pill">
                        {interest.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <div className="destination-list-card-footer">
                <div className="destination-list-info">
                  <span>
                    <Wallet size={13} aria-hidden="true" />
                    Estimated cost
                  </span>
                  <strong>₹{destination.estimated_cost}</strong>
                </div>

                <div className="destination-list-info">
                  <span>
                    <CalendarDays size={13} aria-hidden="true" />
                    Best time
                  </span>
                  <strong>{destination.best_time_to_visit}</strong>
                </div>

                <div className="destination-list-info duration-info">
                  <span>
                    <CalendarDays size={13} aria-hidden="true" />
                    Duration
                  </span>
                  <strong>
                    {destination.recommended_min_days} -{" "}
                    {destination.recommended_max_days} days
                  </strong>
                </div>

                <span className="destination-list-arrow">
                  <ArrowRight size={22} aria-hidden="true" />
                </span>
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
            <ArrowLeft size={15} aria-hidden="true" />
            Previous
          </button>

          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page === totalPages}
          >
            Next
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}

export default Destinations;