import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTrip,
  addDestinationToTrip,
  removeDestinationFromTrip,
} from "../services/tripService";

import {
  getDestinations,
  getInterests,
} from "../services/destinationService";

import { getRecommendations } from "../services/recommendationService";

import "../styles/TripDetails.css";

function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));

  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [interests, setInterests] = useState([]);

  const [recommendationForm, setRecommendationForm] = useState({
    budget: "",
    duration_days: "",
    interest_ids: [],
    month: "",
  });

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] =
    useState(false);
  const [recommendationError, setRecommendationError] =
    useState("");

  useEffect(() => {
    loadTrip();
    loadDestinations();
  }, [tripId]);

  useEffect(() => {
    loadInterests();
  }, []);

  useEffect(() => {
    const savedRecommendations =
      sessionStorage.getItem(
        `recommendations-${tripId}`
      );

    if (!savedRecommendations) {
      return;
    }

    try {
      setRecommendations(
        JSON.parse(savedRecommendations)
      );
    } catch {
      sessionStorage.removeItem(
        `recommendations-${tripId}`
      );
    }
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

  async function loadInterests() {
    try {
      const response = await getInterests();

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load interests"
        );
      }

      setInterests(data);
    } catch (err) {
      setRecommendationError(err.message);
    }
  }

  function handleRecommendationChange(event) {
    const { name, value } = event.target;

    setRecommendationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRecommendationInterest(interestId) {
    setRecommendationForm((prev) => {
      const alreadySelected =
        prev.interest_ids.includes(interestId);

      return {
        ...prev,
        interest_ids: alreadySelected
          ? prev.interest_ids.filter(
              (id) => id !== interestId
            )
          : [...prev.interest_ids, interestId],
      };
    });
  }

  async function handleRecommend() {
    try {
      setRecommendationLoading(true);
      setRecommendationError("");

      const preferences = {
        budget: Number(recommendationForm.budget),
        duration_days: Number(
          recommendationForm.duration_days
        ),
        interest_ids:
          recommendationForm.interest_ids.length > 0
            ? recommendationForm.interest_ids
            : null,
        month: recommendationForm.month
          ? Number(recommendationForm.month)
          : null,
      };

      const response =
        await getRecommendations(preferences);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to get recommendations"
        );
      }

      setRecommendations(data.recommendations);

      sessionStorage.setItem(
        `recommendations-${tripId}`,
        JSON.stringify(data.recommendations)
      );
    } catch (err) {
      setRecommendationError(err.message);
    } finally {
      setRecommendationLoading(false);
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

          {/* Recommendation preferences */}

          <section className="recommendation-section">
            <div className="section-heading">
              <span className="section-label">
                WAYFARER RECOMMENDS
              </span>

              <h2>Find Destinations</h2>

              <p>
                Tell us what you're looking for and we'll find
                destinations that match your trip.
              </p>
            </div>

            <div className="recommendation-form">

              <div className="recommendation-field">
                <label htmlFor="budget">
                  Budget
                </label>

                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="1"
                  placeholder="Example: 20000"
                  value={recommendationForm.budget}
                  onChange={handleRecommendationChange}
                />
              </div>

              <div className="recommendation-field">
                <label htmlFor="duration_days">
                  Trip Duration
                </label>

                <input
                  id="duration_days"
                  name="duration_days"
                  type="number"
                  min="1"
                  placeholder="Example: 4"
                  value={recommendationForm.duration_days}
                  onChange={handleRecommendationChange}
                />

                <span className="field-hint">
                  Number of days
                </span>
              </div>

              <div className="recommendation-field">
                <label htmlFor="month">
                  Travel Month
                </label>

                <select
                  id="month"
                  name="month"
                  value={recommendationForm.month}
                  onChange={handleRecommendationChange}
                >
                  <option value="">
                    Select a month
                  </option>

                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="recommendation-field recommendation-field-full">
                <label>Interests</label>

                <div className="recommendation-interest-selector">
                  {interests.map((interest) => (
                    <label
                      key={interest.id}
                      className="recommendation-interest-option"
                    >
                      <input
                        type="checkbox"
                        checked={recommendationForm.interest_ids.includes(
                          interest.id
                        )}
                        onChange={() =>
                          handleRecommendationInterest(
                            interest.id
                          )
                        }
                      />

                      <span>{interest.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {recommendationError && (
                <div className="recommendation-error">
                  {recommendationError}
                </div>
              )}

              <button
                type="button"
                className="recommendation-button"
                onClick={handleRecommend}
                disabled={recommendationLoading}
              >
                {recommendationLoading
                  ? "Finding destinations..."
                  : "Find Recommendations"}
              </button>
            </div>
          </section>

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

          {/* Recommendation results */}

          {recommendations.length > 0 && (
            <section className="recommendation-results-section">
              <div className="section-heading">
                <span className="section-label">
                  YOUR MATCHES
                </span>

                <h2>Recommended Destinations</h2>

                <p>
                  Destinations are ranked from the strongest match
                  to the weakest.
                </p>
              </div>

              <div className="recommendation-results">
                {recommendations.map((recommendation) => (
                <article
                  className="recommendation-card"
                  key={recommendation.destination.id}
                  onClick={() =>
                    navigate(
                      `/destinations/${recommendation.destination.id}`
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      navigate(
                        `/destinations/${recommendation.destination.id}`
                      );
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                    <div className="recommendation-card-content">
                      <span className="destination-category">
                        {recommendation.destination.category}
                      </span>

                      <h3>
                        {recommendation.destination.name}
                      </h3>

                      <span className="destination-location">
                        📍 {recommendation.destination.location}
                      </span>

                      <p className="recommendation-description">
                        {recommendation.destination.description}
                      </p>

                      <div className="recommendation-score">
                        <span className="recommendation-score-label">
                          Match score
                        </span>

                        <span className="recommendation-score-value">
                          {Math.round(recommendation.score * 100)}%
                        </span>
                      </div>

                      <div className="recommendation-reasons">
                        <h4>Why this matches</h4>

                        {recommendation.reasons.interests && (
                          <div className="recommendation-reason">
                            <span>✓</span>

                            <p>
                              Matches{" "}
                              <strong>
                                {recommendation.reasons.interests.matched}
                              </strong>{" "}
                              of{" "}
                              <strong>
                                {recommendation.reasons.interests.requested}
                              </strong>{" "}
                              selected interests
                            </p>
                          </div>
                        )}

                        {recommendation.reasons.budget && (
                          <div className="recommendation-reason">
                            <span>
                              {recommendation.reasons.budget.within_budget
                                ? "✓"
                                : "○"}
                            </span>

                            <p>
                              {recommendation.reasons.budget.within_budget
                                ? "Within your budget"
                                : "Above your budget"}
                            </p>
                          </div>
                        )}

                        {recommendation.reasons.duration && (
                          <div className="recommendation-reason">
                            <span>
                              {recommendation.reasons.duration.within_range
                                ? "✓"
                                : "○"}
                            </span>

                            <p>
                              {recommendation.reasons.duration.within_range
                                ? "Your trip duration fits the recommended range"
                                : "Your trip duration is outside the recommended range"}
                            </p>
                          </div>
                        )}

                        {recommendation.reasons.season && (
                          <div className="recommendation-reason">
                            <span>
                              {recommendation.reasons.season.recommended
                                ? "✓"
                                : "○"}
                            </span>

                            <p>
                              {recommendation.reasons.season.recommended
                                ? "Your travel month is recommended"
                                : `Your travel month is ${recommendation.reasons.season.nearest_distance} month${
                                    recommendation.reasons.season.nearest_distance !== 1
                                      ? "s"
                                      : ""
                                  } away from the recommended season`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="recommendation-card-footer">


                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          handleAddDestination(
                            recommendation.destination.id
                          );
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

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