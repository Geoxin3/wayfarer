import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";
import "../styles/DestinationDetails.css";
import {
  getDestination,
  getDestinationImages,
  getInterests,
} from "../services/destinationService";
import { BASE_URL } from "../services/api";

function getImageUrl(path) {
  if (!path) return "";

  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  const cleanPath = String(path).replace(/^\/+/, "");
  const uploadPath = cleanPath.startsWith("uploads/")
    ? cleanPath
    : `uploads/${cleanPath}`;

  return `${BASE_URL}/${uploadPath}`;
}

// Lets CSS draw a blurred copy of the photo behind it, so a photo shown
// whole (not cropped) still fills the frame.
function photoBackdrop(src) {
  return src ? { "--photo": `url("${src.replace(/"/g, "%22")}")` } : undefined;
}

function DestinationDetails() {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [interests, setInterests] = useState([]);
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageBroken, setImageBroken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setImages([]);
    setActiveImageIndex(0);
    setImageBroken(false);

    async function loadDestination() {
      try {
        const [destinationResponse, interestsResponse] =
          await Promise.all([
            getDestination(id),
            getInterests(),
          ]);

        if (!destinationResponse.ok) {
          throw new Error("Destination not found");
        }

        if (!interestsResponse.ok) {
          throw new Error("Failed to fetch interests");
        }

        const [destinationData, interestsData] = await Promise.all([
          destinationResponse.json(),
          interestsResponse.json(),
        ]);

        if (cancelled) return;

        setDestination(destinationData);
        setInterests(interestsData);

        // Images are optional; a photo error shouldn't hide the details.
        try {
          const imagesResponse = await getDestinationImages(id);

          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            const imageList = Array.isArray(imagesData)
              ? imagesData
              : imagesData.items ?? [];

            if (!cancelled) {
              setImages(imageList);
            }
          }
        } catch (imageError) {
          console.error("Destination image fetch error:", imageError);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Destination fetch error:", err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDestination();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const showPreviousImage = () => {
    setActiveImageIndex((index) =>
      (index - 1 + images.length) % images.length
    );
    setImageBroken(false);
  };

  const showNextImage = () => {
    setActiveImageIndex((index) =>
      (index + 1) % images.length
    );
    setImageBroken(false);
  };

  const showImage = (index) => {
    setActiveImageIndex(index);
    setImageBroken(false);
  };

  const handleGalleryKeyDown = (event) => {
    if (images.length < 2) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousImage();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextImage();
    }
  };

  if (loading) {
    return <p className="destination-status">Loading destination...</p>;
  }

  if (error) {
    return <p className="destination-status error">{error}</p>;
  }

  const activeImage = images[activeImageIndex];

  return (
    <div className="destination-details-page">
      <div className="destination-details-card">
        <div
          className="destination-details-image-container"
          role="group"
          aria-label={`Photos of ${destination.name}`}
          tabIndex={images.length > 1 ? 0 : undefined}
          onKeyDown={handleGalleryKeyDown}
          style={
            activeImage && !imageBroken
              ? photoBackdrop(getImageUrl(activeImage.image_path))
              : undefined
          }
        >
          {activeImage && !imageBroken ? (
            <img
              key={activeImage.id ?? activeImage.image_path}
              src={getImageUrl(activeImage.image_path)}
              alt={`${destination.name} photo ${activeImageIndex + 1}`}
              onError={() => setImageBroken(true)}
            />
          ) : (
            <div className="destination-image-placeholder">
              <ImageIcon size={34} aria-hidden="true" />
              <span>No photo available</span>
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="destination-image-arrow destination-image-arrow-left"
                onClick={showPreviousImage}
                aria-label="Previous photo"
                title="Previous photo"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="destination-image-arrow destination-image-arrow-right"
                onClick={showNextImage}
                aria-label="Next photo"
                title="Next photo"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>

              <span
                className="destination-image-counter"
                aria-live="polite"
              >
                {activeImageIndex + 1} / {images.length}
              </span>

              <div className="destination-image-dots">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id ?? image.image_path}
                    className={
                      index === activeImageIndex ? "is-current" : undefined
                    }
                    onClick={() => showImage(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-current={index === activeImageIndex}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <span className="destination-category">
          {destination.category}
        </span>

        <h1>{destination.name}</h1>

        <p className="destination-location">
          <MapPin size={15} aria-hidden="true" />
          <span>{destination.location}</span>
        </p>

        <p className="destination-description">
          {destination.description}
        </p>

        <div className="destination-experiences">
          <span className="destination-experiences-label">
            <Sparkles size={16} aria-hidden="true" />
            Experiences
          </span>

          <div className="destination-experiences-list">
            {interests
              .filter((interest) =>
                (destination.interest_ids || []).includes(interest.id)
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
            <span>
              <Wallet size={15} aria-hidden="true" />
              Estimated Cost
            </span>
            <strong>₹{destination.estimated_cost}</strong>
          </div>

          <div>
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              Best Time to Visit
            </span>
            <strong>{destination.best_time_to_visit}</strong>
          </div>

          <div className="duration-info">
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              Duration
            </span>
            <strong>
              {destination.recommended_min_days} -{" "}
              {destination.recommended_max_days} days
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DestinationDetails;