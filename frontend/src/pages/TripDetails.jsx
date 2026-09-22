import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTrip,
  addDestinationToTrip,
  removeDestinationFromTrip,
} from "../services/tripService";

import { getDestinations } from "../services/destinationService";

import "../styles/TripDetails.css";

function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));

  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrip();
    loadDestinations();
  }, [tripId]);

  async function loadTrip() {
    try {
      setLoading(true);
      setError("");

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const response = await getTrip(tripId, userId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load trip"
        );
      }

      setTrip(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDestinations() {
    try {
      const response = await getDestinations(1, 100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load destinations"
        );
      }

      setDestinations(data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddDestination(destinationId) {
    try {
      setError("");

      const response = await addDestinationToTrip(
        tripId,
        destinationId
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to add destination"
        );
      }

      await loadTrip();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveDestination(destinationId) {
    try {
      setError("");

      const response = await removeDestinationFromTrip(
        tripId,
        destinationId
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to remove destination"
        );
      }

      await loadTrip();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="trip-details-message">
        Loading trip...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="trip-details-message">
        <p>{error || "Trip not found."}</p>

        <button
          type="button"
          onClick={() => navigate("/trips")}
        >
          ← Back to My Trips
        </button>
      </div>
    );
  }

  const selectedDestinationIds = new Set(
    trip.destinations.map(
      (destination) => destination.id
    )
  );

  const availableDestinations =
    destinations.filter(
      (destination) =>
        !selectedDestinationIds.has(destination.id)
    );

  return (
    <div className="trip-details-page">
      <header className="trip-details-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/trips")}
        >
          ← My Trips
        </button>

        <span className="trip-details-eyebrow">
          WAYFARER
        </span>

        <h1>{trip.name}</h1>

        <p>
          {trip.start_date} → {trip.end_date}
        </p>
      </header>

      {error && (
        <div className="trip-details-error">
          {error}
        </div>
      )}

      <main className="trip-details-content">
        {/* Selected destinations */}

        <section className="trip-destinations-section">
          <div className="section-heading">
            <span className="section-label">
              YOUR JOURNEY
            </span>

            <h2>Destinations</h2>

            <p>
              {trip.destinations.length} destination
              {trip.destinations.length !== 1
                ? "s"
                : ""}{" "}
              in this trip
            </p>
          </div>

          {trip.destinations.length === 0 ? (
            <div className="empty-destinations">
              <div className="empty-destination-icon">
                +
              </div>

              <h3>No destinations yet</h3>

              <p>
                Start building your journey by adding
                destinations below.
              </p>
            </div>
          ) : (
            <div className="trip-destination-list">
              {trip.destinations.map(
                (destination) => (
                  <article
                    className="trip-destination-card"
                    key={destination.id}
                  >
                    <div className="destination-card-content">
                      <span className="destination-category">
                        {destination.category}
                      </span>

                      <h3>
                        {destination.name}
                      </h3>

                      <span className="destination-location">
                        📍 {destination.location}
                      </span>

                      <p>
                        {destination.description}
                      </p>

                      <div className="destination-meta">
                        <span>
                          ₹
                          {destination.estimated_cost}
                        </span>

                        <span>
                          Best time:{" "}
                          {
                            destination.best_time_to_visit
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-destination-button"
                      onClick={() =>
                        handleRemoveDestination(
                          destination.id
                        )
                      }
                    >
                      Remove
                    </button>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* Available destinations */}

        <section className="add-destination-section">
          <div className="section-heading">
            <span className="section-label">
              EXPLORE
            </span>

            <h2>Add Destinations</h2>

            <p>
              Choose places you'd like to include in
              your journey.
            </p>
          </div>

          {availableDestinations.length === 0 ? (
            <div className="all-destinations-message">
              <h3>All destinations added</h3>

              <p>
                You've added every destination currently
                available in Wayfarer.
              </p>
            </div>
          ) : (
            <div className="destination-catalog">
              {availableDestinations.map(
                (destination) => (
                  <article
                    className="catalog-destination-card"
                    key={destination.id}
                  >
                    <div>
                      <span className="destination-category">
                        {destination.category}
                      </span>

                      <h3>
                        {destination.name}
                      </h3>

                      <span className="destination-location">
                        📍 {destination.location}
                      </span>

                      <p>
                        {destination.description}
                      </p>
                    </div>

                    <div className="catalog-card-footer">
                      <span>
                        ₹
                        {destination.estimated_cost}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddDestination(
                            destination.id
                          )
                        }
                      >
                        + Add
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TripDetails;