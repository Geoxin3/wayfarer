import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/tripService";
import "../styles/PlanTrip.css";

function PlanTrip() {
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const userId = Number(localStorage.getItem("userId"));

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        throw new Error(
          "End date cannot be before the start date"
        );
      }

      const response = await createTrip({
        name: tripName,
        start_date: startDate,
        end_date: endDate,
        user_id: userId,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to create trip"
        );
      }

      console.log("Trip created:", data);

      navigate(`/trips/${data.id}`);
    } catch (err) {
      console.error("Trip creation error:", err);

      if (typeof err.message === "string") {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while creating the trip."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="plan-trip-page">
      <header className="plan-trip-header">
        <span className="plan-trip-eyebrow">
          WAYFARER
        </span>

        <h1>Plan Your Trip</h1>

        <p>
          Create your trip and start building your
          journey.
        </p>
      </header>

      <form
        className="plan-trip-form"
        onSubmit={handleSubmit}
      >
        <section className="plan-trip-section">
          <div className="section-heading">
            <span>01</span>

            <div>
              <h2>Trip Details</h2>

              <p>
                Give your trip a name and choose your
                travel dates.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="trip-name">
              Trip Name
            </label>

            <input
              id="trip-name"
              type="text"
              placeholder="e.g. Kerala Adventure"
              value={tripName}
              onChange={(event) =>
                setTripName(event.target.value)
              }
              required
            />
          </div>

          <div className="date-row">
            <div className="form-group">
              <label htmlFor="start-date">
                Start Date
              </label>

              <input
                id="start-date"
                type="date"
                min={today}
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">
                End Date
              </label>

              <input
                id="end-date"
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                required
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="plan-trip-error">
            {error}
          </div>
        )}

        <div className="plan-trip-actions">
          <button
            type="button"
            className="cancel-trip-button"
            onClick={() => navigate("/trips")}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="create-trip-button"
            disabled={loading}
          >
            {loading
              ? "Creating Trip..."
              : "Create Trip →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlanTrip;