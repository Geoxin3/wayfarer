import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTrips } from "../services/tripService";
import { getDestinationImages } from "../services/destinationService";
import { BASE_URL } from "../services/api";
import "../styles/MyTrip.css";

import {
  CalendarDays,
  Image as ImageIcon,
  MapPin,
  Plus,
  ArrowRight,
  Map,
} from "lucide-react";

const getImageUrl = (path) => {
  if (!path) return "";

  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  const cleanPath = String(path).replace(/^\/+/, "");
  const uploadPath = cleanPath.startsWith("uploads/")
    ? cleanPath
    : `uploads/${cleanPath}`;

  return `${BASE_URL}/${uploadPath}`;
};

function FitPhoto({ path, alt = "", className = "" }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [path]);

  const src = getImageUrl(path);

  return (
    <div
      className={`trip-photo ${className}`}
      style={src ? { "--photo": `url("${src.replace(/"/g, "%22")}")` } : undefined}
    >
      {!broken && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

function TripCover({ destinations, imagesByDestination }) {
  const withPhotos = destinations.filter(
    (destination) => imagesByDestination[destination.id]?.length > 0
  );

  if (withPhotos.length === 0) {
    return (
      <div className="my-trip-image-placeholder" aria-hidden="true">
        <span>No images</span>
      </div>
    );
  }

  const shown = withPhotos.slice(0, 4);
  const hidden = withPhotos.length - shown.length;

  return (
    <div
      className={`my-trip-cover my-trip-cover-${shown.length}`}
      role="img"
      aria-label={`Photos from ${withPhotos.length} destination${
        withPhotos.length !== 1 ? "s" : ""
      } on this trip`}
    >
      {shown.map((destination, index) => (
        <div className="my-trip-cover-tile" key={destination.id}>
          <FitPhoto
            path={imagesByDestination[destination.id][0].image_path}
          />

          {index === shown.length - 1 && hidden > 0 && (
            <span className="my-trip-cover-more">+{hidden}</span>
          )}
        </div>
      ))}

      <span className="my-trip-cover-count" title="Destinations with photos">
        <ImageIcon size={13} aria-hidden="true" />
        {withPhotos.length}
      </span>
    </div>
  );
}

function MyTrips() {
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));

  const [trips, setTrips] = useState([]);
  const [imagesByDestination, setImagesByDestination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrips();
  }, []);

  function loadImages(tripList) {
    const ids = new Set();

    tripList.forEach((trip) =>
      (trip.destinations || []).forEach((destination) =>
        ids.add(destination.id)
      )
    );

    ids.forEach(async (destinationId) => {
      try {
        const response = await getDestinationImages(destinationId);

        if (!response.ok) {
          return;
        }

        const images = await response.json();

        setImagesByDestination((prev) => ({
          ...prev,
          [destinationId]: Array.isArray(images) ? images : [],
        }));
      } catch (err) {
        console.error("Destination image fetch error:", err);
      }
    });
  }

  async function loadTrips() {
    try {
      setLoading(true);
      setError("");

      if (!userId) {
        throw new Error("User is not logged in");
      }

      const response = await getTrips(userId);

      if (!response.ok) {
        throw new Error("Failed to load trips");
      }

      const data = await response.json();

      setTrips(data);
      loadImages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="my-trips-message">
        Loading trips...
      </div>
    );
  }

  return (
    <div className="my-trips-page">
      <header className="my-trips-header">
        <span className="my-trips-eyebrow">WAYFARER</span>

        <h1>My Trips</h1>

        <p>View the trips you have planned.</p>

        {trips.length > 0 && (
          <button
            type="button"
            className="plan-trip-button"
            onClick={() => navigate("/trips/plan")}
          >
            <Plus size={17} aria-hidden="true" />
            <span>Plan a Trip</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </header>

      {error && (
        <div className="my-trips-error">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="my-trips-empty">
          <div className="my-trips-empty-icon" aria-hidden="true">
            <Map size={30} strokeWidth={1.7} />
          </div>

          <h2>No trips planned yet</h2>

          <p>
            Start planning your next journey with Wayfarer.
          </p>

          <button
            type="button"
            className="plan-trip-button"
            onClick={() => navigate("/trips/plan")}
          >
            <Plus size={17} aria-hidden="true" />
            <span>Plan a Trip</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <section className="my-trips-list">
          {trips.map((trip) => (
            <article
              className="my-trip-card"
              key={trip.id}
            >
              <TripCover
                destinations={trip.destinations}
                imagesByDestination={imagesByDestination}
              />

              <div className="my-trip-content">
                <div className="my-trip-card-header">
                  <div className="my-trip-heading">
                    <h2>{trip.name}</h2>

                    <p className="my-trip-date">
                      <CalendarDays
                        size={16}
                        aria-hidden="true"
                      />
                      <span>
                        {trip.start_date} → {trip.end_date}
                      </span>
                    </p>
                  </div>

                  <span className="my-trip-count">
                    {trip.destinations.length} destination
                    {trip.destinations.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="my-trip-destinations">
                  {trip.destinations.length === 0 ? (
                    <p className="no-destinations">
                      No destinations selected yet.
                    </p>
                  ) : (
                    trip.destinations.map((destination) => (
                      <div
                        className="my-trip-destination"
                        key={destination.id}
                      >
                        {imagesByDestination[destination.id]?.[0] && (
                          <FitPhoto
                            className="my-trip-destination-photo"
                            path={
                              imagesByDestination[destination.id][0]
                                .image_path
                            }
                          />
                        )}

                        <div className="my-trip-destination-text">
                          <strong>{destination.name}</strong>

                          <span className="my-trip-location">
                            <MapPin
                              size={14}
                              aria-hidden="true"
                            />
                            <span>{destination.location}</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="my-trip-card-footer">
                  <span>Trip #{trip.id}</span>

                  <button
                    type="button"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    <span>View Trip</span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default MyTrips;