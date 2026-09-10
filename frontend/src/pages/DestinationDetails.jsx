import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/DestinationDetails.css";

function DestinationDetails() {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/destinations/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Destination not found");
        }

        return response.json();
      })
      .then((data) => {
        setDestination(data);
      })
      .catch((err) => {
        console.error("Destination fetch error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="destination-status">Loading destination...</p>;
  }

  if (error) {
    return <p className="destination-status error">{error}</p>;
  }

  return (
    <div className="destination-details-page">
      <div className="destination-details-card">
        <span className="destination-category">
          {destination.category}
        </span>

        <h1>{destination.name}</h1>

        <p className="destination-location">
          📍 {destination.location}
        </p>

        <p className="destination-description">
          {destination.description}
        </p>

        <div className="destination-info">
          <div>
            <span>Estimated Cost</span>
            <strong>₹{destination.estimated_cost}</strong>
          </div>

          <div>
            <span>Best Time to Visit</span>
            <strong>{destination.best_time_to_visit}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DestinationDetails;