import { useEffect, useRef, useState } from "react";
import "./styles/AdminHome.css";
import {
  getDestinations,
  getInterests,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../services/destinationService";

const emptyForm = {
  name: "",
  description: "",
  location: "",
  category: "",
  estimated_cost: "",
  recommended_min_days: "",
  recommended_max_days: "",
  months: [],
  interest_ids: [],
};

function AdminHome() {
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

    const getBestTimeToVisit = (selectedMonths) => {
    if (selectedMonths.length === 0) {
      return "";
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const orderedMonths = [...selectedMonths].sort((a, b) => a - b);

    if (orderedMonths.length === 1) {
      return monthNames[orderedMonths[0] - 1];
    }

    const isNormalRange = orderedMonths.every(
      (month, index) =>
        index === 0 || month === orderedMonths[index - 1] + 1
    );

    if (isNormalRange) {
      return `${monthNames[orderedMonths[0] - 1]} to ${
        monthNames[orderedMonths[orderedMonths.length - 1] - 1]
      }`;
    }

    const firstPart = orderedMonths.filter((month) => month >= 10);
    const secondPart = orderedMonths.filter((month) => month <= 3);

    if (firstPart.length > 0 && secondPart.length > 0) {
      return `${monthNames[firstPart[0] - 1]} to ${
        monthNames[secondPart[secondPart.length - 1] - 1]
      }`;
    }

    return orderedMonths
      .map((month) => monthNames[month - 1])
      .join(", ");
  };  

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDestinations(1, 100);

      if (!response.ok) {
        throw new Error("Failed to fetch destinations");
      }

      const data = await response.json();

      setDestinations(data.items);
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
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchInterests();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMonthChange = (month) => {
    setFormData((prev) => {
      const alreadySelected = prev.months.includes(month);

      return {
        ...prev,
        months: alreadySelected
          ? prev.months.filter((item) => item !== month)
          : [...prev.months, month],
      };
    });
  };

  const handleInterestChange = (interestId) => {
    setFormData((prev) => {
      const alreadySelected = prev.interest_ids.includes(interestId);

      return {
        ...prev,
        interest_ids: alreadySelected
          ? prev.interest_ids.filter((id) => id !== interestId)
          : [...prev.interest_ids, interestId],
      };
    });
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (destination) => {
    setEditingId(destination.id);

    setFormData({
      name: destination.name,
      description: destination.description,
      location: destination.location,
      category: destination.category,
      estimated_cost: destination.estimated_cost,
      recommended_min_days: destination.recommended_min_days,
      recommended_max_days: destination.recommended_max_days,
      months: destination.months || [],
      interest_ids: destination.interest_ids || [],
    });

    setFormError("");
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      const destinationData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        estimated_cost: formData.estimated_cost,
        recommended_min_days: Number(formData.recommended_min_days),
        recommended_max_days: Number(formData.recommended_max_days),
        best_time_to_visit: getBestTimeToVisit(formData.months),
        months: formData.months,
        interest_ids: formData.interest_ids,
      };

      const response = editingId
        ? await updateDestination(editingId, destinationData)
        : await createDestination(destinationData);

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail ||
            `Failed to ${editingId ? "update" : "create"} destination`
        );
      }

      closeForm();
      await fetchDestinations();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (destination) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${destination.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await deleteDestination(destination.id);

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.detail || "Failed to delete destination");
      }

      await fetchDestinations();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-home">
      <header className="admin-home-header">
        <div>
          <span className="admin-home-eyebrow">WAYFARER ADMIN</span>

          <h1>Destination Management</h1>

          <p>
            Manage the destinations available on Wayfarer.
          </p>
        </div>

        <div></div>

        <button
          className="admin-add-button"
          onClick={openAddForm}
        >
          + Add Destination
        </button>
      </header>

      <main className="admin-home-content">
        <div className="admin-destination-count">
          <strong>{destinations.length}</strong>{" "}
          {destinations.length === 1 ? "destination" : "destinations"}
        </div>

        {showForm && (
          <section ref={formRef} className="admin-form-card">
            <div className="admin-form-header">
              <div>
                <span className="admin-form-eyebrow">
                  {editingId ? "EDIT DESTINATION" : "NEW DESTINATION"}
                </span>

                <h2>
                  {editingId
                    ? "Update destination"
                    : "Add a destination"}
                </h2>
              </div>

              <button
                className="admin-close-button"
                onClick={closeForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label htmlFor="name">Name</label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Munnar"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="location">Location</label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Kerala"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="category">Category</label>

                  <input
                    id="category"
                    name="category"
                    type="text"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Hill Station"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="estimated_cost">
                    Estimated Cost
                  </label>

                  <input
                    id="estimated_cost"
                    name="estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={handleInputChange}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="recommended_min_days">
                    Minimum Trip Days
                  </label>

                  <input
                    id="recommended_min_days"
                    name="recommended_min_days"
                    type="number"
                    min="1"
                    value={formData.recommended_min_days}
                    onChange={handleInputChange}
                    placeholder="e.g. 2"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="recommended_max_days">
                    Maximum Trip Days
                  </label>

                  <input
                    id="recommended_max_days"
                    name="recommended_max_days"
                    type="number"
                    min="1"
                    value={formData.recommended_max_days}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="admin-form-field-full">
                  <label>Suitable Months</label>

                  <div className="month-selector">
                    {months.map((month) => (
                      <label className="month-option" key={month.value}>
                        <input
                          type="checkbox"
                          value={month.value}
                          checked={formData.months.includes(month.value)}
                          onChange={() => handleMonthChange(month.value)}
                        />

                        <span>{month.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

<div className="admin-form-field admin-form-field-full">
  <label>Interests</label>

  <div className="interest-selector">
    {interests.map((interest) => (
      <label
        className="interest-option"
        key={interest.id}
      >
        <input
          type="checkbox"
          checked={formData.interest_ids.includes(interest.id)}
          onChange={() => handleInterestChange(interest.id)}
        />

        <span>{interest.name}</span>
      </label>
    ))}
  </div>
</div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="description">Description</label>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the destination..."
                    rows="5"
                    required
                  />
                </div>
              </div>

              {formError && (
                <p className="admin-form-error">
                  {formError}
                </p>
              )}

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-save-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Update Destination"
                      : "Add Destination"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading && (
          <div className="admin-message">
            Loading destinations...
          </div>
        )}

        {error && (
          <div className="admin-message admin-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="admin-destination-list">
            {destinations.length > 0 ? (
              destinations.map((destination) => (
                <article
                  className="admin-destination-card"
                  key={destination.id}
                >
                  <div className="admin-destination-main">
                    <div className="admin-destination-top">
                      <span className="admin-destination-category">
                        {destination.category}
                      </span>

                      <span className="admin-destination-location">
                        📍 {destination.location}
                      </span>
                    </div>

                    <h2>{destination.name}</h2>

                    <p className="admin-destination-description">
                      {destination.description}
                    </p>

                    <div className="admin-destination-details">
                      <div>
                        <span>Estimated cost</span>
                        <strong>
                          ₹{destination.estimated_cost}
                        </strong>
                      </div>

                      <div>
                        <span>Best time</span>
                        <strong>
                          {destination.best_time_to_visit}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-destination-actions">
                    <button
                      className="admin-edit-button"
                      onClick={() => openEditForm(destination)}
                    >
                      Edit
                    </button>

                    <button
                      className="admin-delete-button"
                      onClick={() => handleDelete(destination)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-message">
                <p>No destinations found.</p>

                <button
                  className="admin-add-button"
                  onClick={openAddForm}
                >
                  + Add your first destination
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminHome;