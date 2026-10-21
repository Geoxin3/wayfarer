import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Award,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Heart,
  MapPin,
  MapPinned,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

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

  const resultsRef = useRef(null);

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

  // UI-only state: collapse the form after a search, hide the results panel
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [resultsHidden, setResultsHidden] = useState(false);

  useEffect(() => {
    loadTrip();
    loadDestinations();
  }, [tripId]);

  useEffect(() => {
    loadInterests();
  }, []);

  useEffect(() => {
    const savedRecommendations = sessionStorage.getItem(
      `recommendations-${tripId}`
    );

    if (!savedRecommendations) {
      return;
    }

    try {
      const parsed = JSON.parse(savedRecommendations);

      setRecommendations(parsed);

      const savedForm = sessionStorage.getItem(
        `recommendation-form-${tripId}`
      );

      if (savedForm) {
        setRecommendationForm(JSON.parse(savedForm));

        if (parsed.length > 0) {
          setFormCollapsed(true);
        }
      }
    } catch {
      sessionStorage.removeItem(`recommendations-${tripId}`);
      sessionStorage.removeItem(`recommendation-form-${tripId}`);
    }
  }, [tripId]);

  /*
   * `silent` refreshes the trip without swapping the whole page for the
   * "Loading trip..." screen, so the scroll position is preserved after
   * adding or removing a destination
   */
  async function loadTrip({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoading(true);
      }

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
      if (!silent) {
        setLoading(false);
      }
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

      await loadTrip({ silent: true });
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

      await loadTrip({ silent: true });
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
          ? prev.interest_ids.filter((id) => id !== interestId)
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
        duration_days: Number(recommendationForm.duration_days),
        interest_ids:
          recommendationForm.interest_ids.length > 0
            ? recommendationForm.interest_ids
            : null,
        month: recommendationForm.month
          ? Number(recommendationForm.month)
          : null,
      };

      const response = await getRecommendations(preferences);

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

      sessionStorage.setItem(
        `recommendation-form-${tripId}`,
        JSON.stringify(recommendationForm)
      );

      setResultsHidden(false);
      setFormCollapsed(true);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch (err) {
      setRecommendationError(err.message);
    } finally {
      setRecommendationLoading(false);
    }
  }

  function handleClearRecommendations() {
    setRecommendations([]);
    setResultsHidden(false);
    setFormCollapsed(false);

    sessionStorage.removeItem(`recommendations-${tripId}`);
    sessionStorage.removeItem(`recommendation-form-${tripId}`);
  }

  function openDestination(destinationId) {
    navigate(`/destinations/${destinationId}`);
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
    trip.destinations.map((destination) => destination.id)
  );

  const availableDestinations = destinations.filter(
    (destination) => !selectedDestinationIds.has(destination.id)
  );

  // Hide recommendations that are already part of the trip
  const visibleRecommendations = recommendations.filter(
    (recommendation) =>
      !selectedDestinationIds.has(recommendation.destination.id)
  );

  return (
    <div className="trip-details-page">
      <header className="trip-details-header">

        <span className="trip-details-eyebrow">WAYFARER</span>

        <h1>{trip.name}</h1>

        <div className="trip-details-meta">
          <span className="trip-meta-chip">
            <CalendarDays size={15} aria-hidden="true" />
            {trip.start_date} → {trip.end_date}
          </span>

          <span className="trip-meta-chip">
            <MapPinned size={15} aria-hidden="true" />
            {trip.destinations.length} destination
            {trip.destinations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {error && (
        <div className="trip-details-error">{error}</div>
      )}

      <main className="trip-details-content">

        {/* Recommendation preferences */}

        <section className="recommendation-section">
          {formCollapsed ? (
            <div className="recommendation-summary">
              <div className="recommendation-summary-main">
                <span className="section-label">
                  WAYFARER RECOMMENDS
                </span>

                <div className="recommendation-summary-chips">
                  {recommendationForm.budget && (
                    <span className="summary-chip">
                      Budget ₹
                      {Number(
                        recommendationForm.budget
                      ).toLocaleString("en-IN")}
                    </span>
                  )}

                  {recommendationForm.duration_days && (
                    <span className="summary-chip">
                      {recommendationForm.duration_days} day
                      {Number(recommendationForm.duration_days) !== 1
                        ? "s"
                        : ""}
                    </span>
                  )}

                  {recommendationForm.month && (
                    <span className="summary-chip">
                      {new Date(
                        2000,
                        Number(recommendationForm.month) - 1,
                        1
                      ).toLocaleString("en-US", { month: "long" })}
                    </span>
                  )}

                  {recommendationForm.interest_ids.length > 0 && (
                    <span className="summary-chip">
                      {recommendationForm.interest_ids.length} interest
                      {recommendationForm.interest_ids.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="recommendation-edit-button"
                onClick={() => setFormCollapsed(false)}
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Edit preferences
              </button>
            </div>
          ) : (
          <>
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
                <Wallet size={14} aria-hidden="true" />
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
                <Clock size={14} aria-hidden="true" />
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

              <span className="field-hint">Number of days</span>
            </div>

            <div className="recommendation-field">
              <label htmlFor="month">
                <CalendarDays size={14} aria-hidden="true" />
                Travel Month
              </label>

              <select
                id="month"
                name="month"
                value={recommendationForm.month}
                onChange={handleRecommendationChange}
              >
                <option value="">Select a month</option>

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
              <label>
                <Heart size={14} aria-hidden="true" />
                Interests
              </label>

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
                        handleRecommendationInterest(interest.id)
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
              <Search size={16} aria-hidden="true" />
              {recommendationLoading
                ? "Finding destinations..."
                : "Find Recommendations"}
            </button>
          </div>
          </>
          )}
        </section>

        {/* Recommendation results */}

        {recommendations.length > 0 && (
          <section
            className={`recommendation-results-section${
              resultsHidden ? " is-collapsed" : ""
            }`}
            ref={resultsRef}
          >
            <div className="results-header">
              <div className="section-heading">
                <span className="section-label">YOUR MATCHES</span>

                <h2>Recommended Destinations</h2>

                <p>
                  Destinations are ranked from the strongest match
                  to the weakest.
                </p>
              </div>

              <div className="results-actions">
                <button
                  type="button"
                  className="results-action-button"
                  onClick={() => setResultsHidden((prev) => !prev)}
                >
                  {resultsHidden ? (
                    <Eye size={14} aria-hidden="true" />
                  ) : (
                    <EyeOff size={14} aria-hidden="true" />
                  )}
                  {resultsHidden
                    ? `Show (${visibleRecommendations.length})`
                    : "Hide"}
                </button>

                <button
                  type="button"
                  className="results-action-button results-action-clear"
                  onClick={handleClearRecommendations}
                >
                  <X size={14} aria-hidden="true" />
                  Clear
                </button>
              </div>
            </div>

            {resultsHidden ? null : visibleRecommendations.length === 0 ? (
              <div className="recommendation-results-empty">
                <h3>Every match is already in your trip</h3>

                <p>
                  Adjust your preferences above to discover more
                  destinations.
                </p>
              </div>
            ) : (
              <div className="recommendation-results">
                {visibleRecommendations.map(
                  (recommendation, index) => {
                    const scorePercent = Math.round(
                      recommendation.score * 100
                    );

                    return (
                      <article
                        className="recommendation-card"
                        key={recommendation.destination.id}
                        onClick={() =>
                          openDestination(
                            recommendation.destination.id
                          )
                        }
                        onKeyDown={(event) => {
                          // Ignore key presses coming from the inner
                          // "+ Add" button.
                          if (event.target !== event.currentTarget) {
                            return;
                          }

                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();

                            openDestination(
                              recommendation.destination.id
                            );
                          }
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <div
                          className="recommendation-image-container"
                          aria-label={`Image area for ${recommendation.destination.name}`}
                        />

                        <div className="recommendation-card-content">
                          <div className="recommendation-card-top">
                            <span className="destination-category">
                              {recommendation.destination.category}
                            </span>

                            <span className="recommendation-rank">
                              <Award size={14} aria-hidden="true" />
                              #{index + 1} match
                            </span>
                          </div>

                          <h3>{recommendation.destination.name}</h3>

                          <span className="destination-location">
                            <MapPin size={14} aria-hidden="true" />
                            {recommendation.destination.location}
                          </span>

                          <p className="recommendation-description">
                            {recommendation.destination.description}
                          </p>

                          <div className="recommendation-score">
                            <div className="recommendation-score-row">
                              <span className="recommendation-score-label">
                                <Sparkles size={12} aria-hidden="true" />
                                Match score
                              </span>

                              <span className="recommendation-score-value">
                                {scorePercent}%
                              </span>
                            </div>

                            <div
                              className="recommendation-score-bar"
                              aria-hidden="true"
                            >
                              <span
                                style={{ width: `${scorePercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="recommendation-reasons">
                            <h4>Why this matches</h4>

                                {recommendation.reasons.interests && (
                                  <div className="recommendation-reason">
                                <span
                                  className={`reason-icon ${
                                    recommendation.reasons.interests.matched ===
                                    recommendation.reasons.interests.requested
                                      ? "met"
                                      : "unmet"
                                  }`}
                                >
                                  {recommendation.reasons.interests.matched ===
                                  recommendation.reasons.interests.requested ? (
                                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  ) : (
                                    <Circle size={9} strokeWidth={3} aria-hidden="true" />
                                  )}
                                </span>
                                <p>
                                  Matches{" "}
                                  <strong>
                                    {
                                      recommendation.reasons.interests
                                        .matched
                                    }
                                  </strong>{" "}
                                  of{" "}
                                  <strong>
                                    {
                                      recommendation.reasons.interests
                                        .requested
                                    }
                                  </strong>{" "}
                                  selected interests
                                </p>
                              </div>
                            )}

                            {recommendation.reasons.budget && (
                              <div className="recommendation-reason">
                                <span
                                  className={`reason-icon ${
                                    recommendation.reasons.budget
                                      .within_budget
                                      ? "met"
                                      : "unmet"
                                  }`}
                                >
                                  {recommendation.reasons.budget
                                    .within_budget
                                    ? (
                                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  ) : (
                                    <Circle size={9} strokeWidth={3} aria-hidden="true" />
                                  )}
                                </span>

                                <p>
                                  {recommendation.reasons.budget
                                    .within_budget
                                    ? "Within your budget"
                                    : "Above your budget"}
                                </p>
                              </div>
                            )}

                            {recommendation.reasons.duration && (
                              <div className="recommendation-reason">
                                <span
                                  className={`reason-icon ${
                                    recommendation.reasons.duration
                                      .within_range
                                      ? "met"
                                      : "unmet"
                                  }`}
                                >
                                  {recommendation.reasons.duration
                                    .within_range
                                    ? (
                                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  ) : (
                                    <Circle size={9} strokeWidth={3} aria-hidden="true" />
                                  )}
                                </span>

                                <p>
                                  {recommendation.reasons.duration
                                    .within_range
                                    ? "Your trip duration fits the recommended range"
                                    : "Your trip duration is outside the recommended range"}
                                </p>
                              </div>
                            )}

                            {recommendation.reasons.season && (
                              <div className="recommendation-reason">
                                <span
                                  className={`reason-icon ${
                                    recommendation.reasons.season
                                      .recommended
                                      ? "met"
                                      : "unmet"
                                  }`}
                                >
                                  {recommendation.reasons.season
                                    .recommended
                                    ? (
                                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  ) : (
                                    <Circle size={9} strokeWidth={3} aria-hidden="true" />
                                  )}
                                </span>

                                <p>
                                  {recommendation.reasons.season
                                    .recommended
                                    ? "Your travel month is recommended"
                                    : `Your travel month is ${
                                        recommendation.reasons.season
                                          .nearest_distance
                                      } month${
                                        recommendation.reasons.season
                                          .nearest_distance !== 1
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
                            <Plus size={15} aria-hidden="true" />
                            Add to trip
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* Selected destinations */}

        <section className="trip-destinations-section">
          <div className="section-heading">
            <span className="section-label">YOUR JOURNEY</span>

            <h2>Destinations</h2>

            <p>
              {trip.destinations.length} destination
              {trip.destinations.length !== 1 ? "s" : ""} in this
              trip
            </p>
          </div>

          {trip.destinations.length === 0 ? (
            <div className="empty-destinations">
              <div className="empty-destination-icon">
                <Plus size={22} aria-hidden="true" />
              </div>

              <h3>No destinations yet</h3>

              <p>
                Start building your journey by adding destinations
                below.
              </p>
            </div>
          ) : (
            <div className="trip-destination-list">
              {trip.destinations.map((destination) => (
                  <article
                    className="trip-destination-card"
                    key={destination.id}
                    onClick={() => openDestination(destination.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        openDestination(destination.id);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                  <div
                    className="trip-destination-image-container"
                    aria-label={`Image area for ${destination.name}`}
                  />

                  <div className="destination-card-content">
                    <span className="destination-category">
                      {destination.category}
                    </span>

                    <h3>{destination.name}</h3>

                    <span className="destination-location">
                      <MapPin size={14} aria-hidden="true" />
                      {destination.location}
                    </span>

                    <p>{destination.description}</p>

                    <div className="destination-meta">
                      <span>₹{destination.estimated_cost}</span>

                      <span>
                        <CalendarDays size={13} aria-hidden="true" />
                        Best time: {destination.best_time_to_visit}
                      </span>

                      <span>
                        <Clock size={13} aria-hidden="true" />
                        Duration: {destination.recommended_min_days} -{" "}
                        {destination.recommended_max_days} days
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-destination-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRemoveDestination(destination.id)
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Available destinations */}

        <section className="add-destination-section">
          <div className="section-heading">
            <span className="section-label">EXPLORE</span>

            <h2>Add Destinations</h2>

            <p>
              Choose places you'd like to include in your journey.
            </p>
          </div>

          {availableDestinations.length === 0 ? (
            <div className="all-destinations-message">
              <h3>All destinations added</h3>

              <p>
                You've added every destination currently available
                in Wayfarer.
              </p>
            </div>
          ) : (
            <div className="destination-catalog">
              {availableDestinations.map((destination) => (
                  <article
                    className="catalog-destination-card"
                    key={destination.id}
                    onClick={() => openDestination(destination.id)}
                  >
                  <div
                    className="catalog-destination-image-container"
                    aria-label={`Image area for ${destination.name}`}
                  />

                  <div>
                    <span className="destination-category">
                      {destination.category}
                    </span>

                    <h3>{destination.name}</h3>

                    <span className="destination-location">
                      <MapPin size={14} aria-hidden="true" />
                      {destination.location}
                    </span>

                    <p>{destination.description}</p>
                  </div>

                  <div className="catalog-card-footer">
                    <span>₹{destination.estimated_cost}</span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleAddDestination(destination.id)
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TripDetails;