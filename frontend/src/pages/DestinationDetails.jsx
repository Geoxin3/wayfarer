import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/DestinationDetails.css";
import {
  getDestination,
  getInterests,
} from "../services/destinationService";

function DestinationDetails() {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getDestination(id),
      getInterests(),
    ])
      .then(async ([destinationResponse, interestsResponse]) => {
        if (!destinationResponse.ok) {
          throw new Error("Destination not found");
        }

        if (!interestsResponse.ok) {
          throw new Error("Failed to fetch interests");
        }

        const destinationData = await destinationResponse.json();
        const interestsData = await interestsResponse.json();

        setDestination(destinationData);
        setInterests(interestsData);
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

        <div className="destination-experiences">
          <span className="destination-experiences-label">
            Experiences
          </span>

          <div className="destination-experiences-list">
            {interests
              .filter((interest) =>
                destination.interest_ids.includes(interest.id)
              )
              .map((interest) => (
                <span
                  className="destination-experience"
                  key={interest.id}
                >
                  {interest.name}
                </span>
              ))}
          </div>
        </div>

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