import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./styles/AdminHome.css";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  LogOut,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  getDestinations,
  getInterests,
  createDestination,
  updateDestination,
  deleteDestination,
  getDestinationImages,
  uploadDestinationImages,
  updateDestinationImage,
  deleteDestinationImage,
} from "../services/destinationService";
import { BASE_URL } from "../services/api";

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

// The list loads in small batches as the admin scrolls. The API accepts at
// most 100 per request. "Load all" uses the biggest batch to finish quickly.
const BATCH_SIZE = 12;
const LOAD_ALL_BATCH_SIZE = 100;

// Field limits used by the browser validation in the form.
const LIMITS = {
  name: { min: 2, max: 100 },
  location: { min: 2, max: 100 },
  category: { min: 2, max: 50 },
  description: { min: 10, max: 1000 },
  cost: { min: 0, max: 100000000 },
  days: { min: 1, max: 365 },
};

const SORT_OPTIONS = [
  { value: "default", label: "Default order" },
  { value: "name-asc", label: "Name (A to Z)" },
  { value: "name-desc", label: "Name (Z to A)" },
  { value: "cost-asc", label: "Cost (low to high)" },
  { value: "cost-desc", label: "Cost (high to low)" },
  { value: "days-asc", label: "Duration (short to long)" },
  { value: "days-desc", label: "Duration (long to short)" },
];

const SORTERS = {
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "cost-asc": (a, b) => Number(a.estimated_cost) - Number(b.estimated_cost),
  "cost-desc": (a, b) => Number(b.estimated_cost) - Number(a.estimated_cost),
  "days-asc": (a, b) =>
    Number(a.recommended_min_days) - Number(b.recommended_min_days),
  "days-desc": (a, b) =>
    Number(b.recommended_max_days) - Number(a.recommended_max_days),
};

// Photo rules: These mirror the backend: JPG / PNG / WebP, 5 MB each
// MAX_IMAGES is only a limit for this form, the backend has none
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

// The API stores a path like "uploads/destinations/destinationname/abc.jpg" and
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


const validateImageFile = (file) => {
  if (!IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: only JPG, PNG or WebP images are allowed.`;
  }

  if (file.size === 0) {
    return `${file.name}: the file is empty.`;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `${file.name}: larger than 5 MB.`;
  }

  return "";
};

const photoBackdrop = (src) =>
  src ? { "--photo": `url("${String(src).replace(/"/g, "%22")}")` } : undefined;

const isSameFile = (a, b) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

// Cover photo on a destination card. The photos are only requested once
function CardImage({ destination, images, onNeedImages }) {
  const containerRef = useRef(null);
  const [broken, setBroken] = useState(false);
  const cover = images?.[0];

  useEffect(() => {
    if (images !== undefined) {
      return undefined;
    }

    const node = containerRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      onNeedImages(destination.id);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onNeedImages(destination.id);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [images, destination.id, onNeedImages]);

  useEffect(() => {
    setBroken(false);
  }, [cover?.image_path]);

  return (
    <div
      className="admin-destination-image-container"
      ref={containerRef}
      style={cover && !broken ? photoBackdrop(getImageUrl(cover.image_path)) : undefined}
    >
      {cover && !broken ? (
        <img
          src={getImageUrl(cover.image_path)}
          alt={destination.name}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="admin-image-placeholder" aria-hidden="true">
          <ImageIcon size={30} />
        </span>
      )}

      {images?.length > 1 && (
        <span
          className="admin-image-count"
          title={`${images.length} photos`}
        >
          <ImageIcon size={13} aria-hidden="true" />
          {images.length}
        </span>
      )}
    </div>
  );
}

function ExistingPhotoTile({
  image,
  replacement,
  removed,
  disabled,
  onRemove,
  onUndoRemove,
  onReplace,
  onUndoReplace,
}) {
  const previewUrl = useObjectUrl(replacement);
  const src = previewUrl || getImageUrl(image.image_path);

  return (
    <li
      className={`admin-photo-tile${removed ? " is-removed" : ""}${
        replacement ? " is-replaced" : ""
      }`}
      style={photoBackdrop(src)}
    >
      <img src={src} alt="" loading="lazy" />

      {replacement && !removed && (
        <span className="admin-photo-badge admin-photo-badge-replace">
          Replacing
        </span>
      )}

      {removed ? (
        <div className="admin-photo-overlay">
          <span>Will be removed</span>

          <button
            type="button"
            className="admin-photo-undo"
            onClick={onUndoRemove}
            disabled={disabled}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Undo
          </button>
        </div>
      ) : (
        <div className="admin-photo-actions">
          {replacement ? (
            <button
              type="button"
              className="admin-photo-action"
              onClick={onUndoReplace}
              disabled={disabled}
              aria-label="Undo replacing this photo"
              title="Undo replace"
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          ) : (
            <label
              className="admin-photo-action"
              title="Replace this photo"
            >
              <RefreshCw size={15} aria-hidden="true" />

              <input
                type="file"
                className="admin-file-input"
                accept={IMAGE_TYPES.join(",")}
                aria-label="Replace this photo"
                disabled={disabled}
                onChange={(event) => {
                  onReplace(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          )}

          <button
            type="button"
            className="admin-photo-action admin-photo-action-danger"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove this photo"
            title="Remove this photo"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

function NewPhotoTile({ file, disabled, onRemove }) {
  const previewUrl = useObjectUrl(file);

  return (
    <li className="admin-photo-tile" style={photoBackdrop(previewUrl)}>
      {previewUrl && <img src={previewUrl} alt="" />}

      <span className="admin-photo-badge">New</span>

      <div className="admin-photo-actions">
        <button
          type="button"
          className="admin-photo-action admin-photo-action-danger"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          title="Remove"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

// The photos part of the add / edit form nothing is sent to the server
// from here: changes are staged and only applied when the form is saved
function PhotoManager({
  existing,
  removedIds,
  replacements,
  newFiles,
  loading,
  loadError,
  notice,
  slotsLeft,
  keptCount,
  disabled,
  onAddFiles,
  onRemoveExisting,
  onUndoRemove,
  onReplace,
  onUndoReplace,
  onRemoveNew,
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const hasTiles = existing.length > 0 || newFiles.length > 0;
  const canAdd = slotsLeft > 0 && !disabled;

  return (
    <div
      className={`admin-form-field admin-form-field-full admin-photos${
        dragging ? " is-dragging" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);

        if (canAdd) {
          onAddFiles(event.dataTransfer.files);
        }
      }}
    >
      <label htmlFor={inputId}>
        <ImageIcon size={15} aria-hidden="true" />
        Photos
        <span className="admin-field-hint">
          Optional · {keptCount + newFiles.length} of {MAX_IMAGES}
        </span>
      </label>

      <input
        id={inputId}
        type="file"
        className="admin-file-input admin-photos-input"
        accept={IMAGE_TYPES.join(",")}
        multiple
        disabled={!canAdd}
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {notice && (
        <p className="admin-photo-notice" role="alert">
          {notice}
        </p>
      )}

      {loadError && (
        <p className="admin-photo-notice" role="alert">
          {loadError}
        </p>
      )}

      <ul className="admin-photo-grid">
        {existing.map((image) => (
          <ExistingPhotoTile
            key={image.id}
            image={image}
            replacement={replacements[image.id]}
            removed={removedIds.includes(image.id)}
            disabled={disabled}
            onRemove={() => onRemoveExisting(image.id)}
            onUndoRemove={() => onUndoRemove(image.id)}
            onReplace={(files) => onReplace(image.id, files)}
            onUndoReplace={() => onUndoReplace(image.id)}
          />
        ))}

        {newFiles.map((item) => (
          <NewPhotoTile
            key={item.key}
            file={item.file}
            disabled={disabled}
            onRemove={() => onRemoveNew(item.key)}
          />
        ))}

        {slotsLeft > 0 && (
          <li
            className={`admin-photo-add-item${
              hasTiles || loading ? "" : " is-empty"
            }`}
          >
            <label
              htmlFor={inputId}
              className={`admin-photo-add${canAdd ? "" : " is-disabled"}`}
            >
              <Plus size={hasTiles ? 24 : 26} aria-hidden="true" />

              <span className="admin-photo-add-title">
                {hasTiles ? "Add more" : "Add photos"}
              </span>

              {!hasTiles && !loading && (
                <span className="admin-photo-add-hint">
                  Click or drop photos here
                </span>
              )}
            </label>
          </li>
        )}
      </ul>

      {loading && (
        <p className="admin-photo-status">Loading current photos...</p>
      )}

      <p className="admin-photo-status">
        JPG, PNG or WebP · up to 5 MB each · you can add several at once
      </p>
    </div>
  );
}

function FilterSelect({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selected = options[selectedIndex];

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const handleKeyDown = (event) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }

      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(options[activeIndex]);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
    }
  };

  return (
    <div
      className={`admin-filter${open ? " is-open" : ""}${
        value !== options[0].value ? " has-value" : ""
      }`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="admin-filter-trigger"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className="admin-filter-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="admin-filter-value">{selected?.label}</span>
        <ChevronDown
          size={16}
          className="admin-filter-chevron"
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          className="admin-filter-list"
          id={listId}
          role="listbox"
          aria-label={label}
          ref={listRef}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              className={`admin-filter-option${
                option.value === value ? " is-selected" : ""
              }${index === activeIndex ? " is-active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check size={15} aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmDialog({
  icon,
  tone = "default",
  title,
  description,
  confirmLabel,
  confirmIcon,
  busy = false,
  onCancel,
  onConfirm,
}) {

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="admin-dialog-overlay">
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-description"
      >
        <div
          className={`admin-dialog-icon admin-dialog-icon-${tone}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <h2 id="admin-dialog-title">{title}</h2>

        <p id="admin-dialog-description">{description}</p>

        <div className="admin-dialog-actions">
          <button
            type="button"
            className="admin-dialog-cancel"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            <X size={16} aria-hidden="true" />
            Cancel
          </button>

          <button
            type="button"
            className={`admin-dialog-confirm admin-dialog-confirm-${tone}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmIcon}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminHome() {
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const [total, setTotal] = useState(0);
  const [pagedCount, setPagedCount] = useState(0);
  const totalRef = useRef(0);
  const pagedCountRef = useRef(0);
  const busyRef = useRef(false);
  const sentinelRef = useRef(null);

  const [imagesByDestination, setImagesByDestination] = useState({});
  const imageRequestsRef = useRef(new Set());
  const activeImageIdRef = useRef(null);
  const fileKeyRef = useRef(0);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [replacements, setReplacements] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [imageNotice, setImageNotice] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const deferredSearch = useDeferredValue(search);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    navigate("/admin", { replace: true });
  };

  const openDestination = (destinationId) => {
    navigate(`/destinations/${destinationId}`);
  };

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

  const updateTotal = (value) => {
    totalRef.current = value;
    setTotal(value);
  };

  const updatePaged = (value) => {
    pagedCountRef.current = value;
    setPagedCount(value);
  };

  const fetchBatch = async (size) => {
    const page = Math.floor(pagedCountRef.current / size) + 1;
    const response = await getDestinations(page, size);

    if (!response.ok) {
      throw new Error("Failed to fetch destinations");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    updatePaged((page - 1) * size + items.length);

    if (typeof data.total === "number") {
      updateTotal(data.total);
    } else if (items.length < size) {
      updateTotal(pagedCountRef.current);
    }

    if (items.length === 0) {
      updateTotal(pagedCountRef.current);
    }

    setDestinations((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const fresh = items.filter((item) => !seen.has(item.id));

      return fresh.length > 0 ? [...prev, ...fresh] : prev;
    });

    return items.length;
  };

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError("");
      setLoadMoreError("");

      updatePaged(0);
      updateTotal(0);
      setDestinations([]);

      await fetchBatch(BATCH_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");

    try {
      await fetchBatch(BATCH_SIZE);
    } catch {
      setLoadMoreError("Couldn't load more destinations.");
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  };

  const loadAll = async () => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setLoadingMore(true);
    setLoadingAll(true);
    setLoadMoreError("");

    try {
      while (pagedCountRef.current < totalRef.current) {
        const received = await fetchBatch(LOAD_ALL_BATCH_SIZE);

        if (received === 0) {
          break;
        }
      }
    } catch {
      setLoadMoreError("Couldn't load all destinations.");
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
      setLoadingAll(false);
    }
  };

  const ensureImages = useCallback(async (destinationId) => {
    if (imageRequestsRef.current.has(destinationId)) {
      return;
    }

    imageRequestsRef.current.add(destinationId);

    try {
      const response = await getDestinationImages(destinationId);

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();

      setImagesByDestination((prev) => ({
        ...prev,
        [destinationId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      imageRequestsRef.current.delete(destinationId);
    }
  }, []);

  const refreshImages = async (destinationId) => {
    try {
      const response = await getDestinationImages(destinationId);

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      const images = Array.isArray(data) ? data : [];

      imageRequestsRef.current.add(destinationId);
      setImagesByDestination((prev) => ({ ...prev, [destinationId]: images }));

      if (activeImageIdRef.current === destinationId) {
        setExistingImages(images);
      }
    } catch {}
  };

  const resetImageState = () => {
    activeImageIdRef.current = null;
    setExistingImages([]);
    setImagesLoading(false);
    setImagesError("");
    setRemovedImageIds([]);
    setReplacements({});
    setNewFiles([]);
    setImageNotice("");
  };

  const loadFormImages = async (destinationId) => {
    activeImageIdRef.current = destinationId;
    setExistingImages(imagesByDestination[destinationId] || []);
    setImagesLoading(true);
    setImagesError("");

    try {
      const response = await getDestinationImages(destinationId);

      if (!response.ok) {
        throw new Error("Couldn't load the current photos.");
      }

      const data = await response.json();

      if (activeImageIdRef.current === destinationId) {
        setExistingImages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (activeImageIdRef.current === destinationId) {
        setImagesError(err.message || "Couldn't load the current photos.");
      }
    } finally {
      if (activeImageIdRef.current === destinationId) {
        setImagesLoading(false);
      }
    }
  };

  const keptImageCount = existingImages.filter(
    (image) => !removedImageIds.includes(image.id)
  ).length;
  const imageSlotsLeft = Math.max(0, MAX_IMAGES - keptImageCount - newFiles.length);

  const addImageFiles = (fileList) => {
    const messages = [];
    const accepted = [];
    let slots = imageSlotsLeft;

    Array.from(fileList || []).forEach((file) => {
      const problem = validateImageFile(file);

      if (problem) {
        messages.push(problem);
        return;
      }

      if (
        newFiles.some((item) => isSameFile(item.file, file)) ||
        accepted.some((item) => isSameFile(item, file))
      ) {
        messages.push(`${file.name}: already added.`);
        return;
      }

      if (slots <= 0) {
        messages.push(`${file.name}: a destination can have up to ${MAX_IMAGES} photos.`);
        return;
      }

      accepted.push(file);
      slots -= 1;
    });

    if (accepted.length > 0) {
      setNewFiles((prev) => [
        ...prev,
        ...accepted.map((file) => {
          fileKeyRef.current += 1;
          return { key: fileKeyRef.current, file };
        }),
      ]);
    }

    setImageNotice(messages.join(" "));
  };

  const replaceImageFile = (imageId, fileList) => {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    const problem = validateImageFile(file);

    setImageNotice(problem);

    if (!problem) {
      setReplacements((prev) => ({ ...prev, [imageId]: file }));
    }
  };

  const undoReplaceImage = (imageId) => {
    setReplacements((prev) => {
      const next = { ...prev };
      delete next[imageId];
      return next;
    });
  };

  const removeExistingImage = (imageId) => {
    undoReplaceImage(imageId);
    setRemovedImageIds((prev) => [...prev, imageId]);
    setImageNotice("");
  };

  const readDetail = async (response, fallback) => {
    const data = await response.json().catch(() => null);

    return typeof data?.detail === "string" ? data.detail : fallback;
  };

  const applyImageChanges = async (destinationId) => {
    const problems = [];

    for (const imageId of removedImageIds) {
      try {
        const response = await deleteDestinationImage(destinationId, imageId);

        if (!response.ok && response.status !== 404) {
          throw new Error(
            await readDetail(response, "Couldn't remove a photo.")
          );
        }

        setRemovedImageIds((prev) => prev.filter((id) => id !== imageId));
      } catch (err) {
        problems.push(err.message || "Couldn't remove a photo.");
      }
    }

    for (const [imageId, file] of Object.entries(replacements)) {
      try {
        const response = await updateDestinationImage(
          destinationId,
          Number(imageId),
          file
        );

        if (!response.ok) {
          throw new Error(
            `${file.name}: ${await readDetail(response, "couldn't replace the photo.")}`
          );
        }

        undoReplaceImage(Number(imageId));
      } catch (err) {
        problems.push(err.message || "Couldn't replace a photo.");
      }
    }

    if (newFiles.length > 0) {
      try {
        const response = await uploadDestinationImages(
          destinationId,
          newFiles.map((item) => item.file)
        );

        if (!response.ok) {
          throw new Error(
            await readDetail(response, "Couldn't upload the new photos.")
          );
        }

        setNewFiles([]);
      } catch (err) {
        problems.push(err.message || "Couldn't upload the new photos.");
      }
    }

    return problems;
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

  useEffect(() => {
    const form = formRef.current?.querySelector("form");

    if (!form) {
      return;
    }

    ["name", "location", "category", "description"].forEach((field) => {
      const value = formData[field];

      form.elements[field].setCustomValidity(
        value !== "" && value.trim() === ""
          ? "This field can't contain only spaces."
          : ""
      );
    });

    const minDays = Number(formData.recommended_min_days);
    const maxDays = Number(formData.recommended_max_days);

    form.elements.recommended_max_days.setCustomValidity(
      formData.recommended_min_days !== "" &&
        formData.recommended_max_days !== "" &&
        maxDays < minDays
        ? "Maximum days can't be less than the minimum days."
        : ""
    );

    const firstMonth = form.querySelector(".month-selector input");

    if (firstMonth) {
      firstMonth.setCustomValidity(
        formData.months.length === 0
          ? "Select at least one suitable month."
          : ""
      );
    }

    const firstInterest = form.querySelector(".interest-selector input");

    if (firstInterest) {
      firstInterest.setCustomValidity(
        formData.interest_ids.length === 0
          ? "Select at least one interest."
          : ""
      );
    }
  }, [formData, interests, showForm]);

  const categories = useMemo(
    () =>
      [...new Set(destinations.map((item) => item.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [destinations]
  );

  const filteredDestinations = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    let result = destinations.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [item.name, item.location, item.category, item.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    if (SORTERS[sortBy]) {
      result = [...result].sort(SORTERS[sortBy]);
    }

    return result;
  }, [destinations, deferredSearch, categoryFilter, sortBy]);

  const visibleDestinations = filteredDestinations;
  const hasMore = pagedCount < total;

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "" || sortBy !== "default";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setSortBy("default");
  };

  useEffect(() => {
    if (categoryFilter && !categories.includes(categoryFilter)) {
      setCategoryFilter("");
    }
  }, [categories, categoryFilter]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (
      !node ||
      !hasMore ||
      hasActiveFilters ||
      loadMoreError ||
      loading ||
      loadingMore ||
      typeof IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, hasActiveFilters, loadMoreError, loading, loadingMore, pagedCount]);

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
    resetImageState();
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (destination) => {
    resetImageState();
    loadFormImages(destination.id);
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
    resetImageState();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      const destinationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        category: formData.category.trim(),
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

      const wasEditing = Boolean(editingId);
      const saved = await response.json().catch(() => null);
      const destinationId = wasEditing ? editingId : saved?.id;

      const hasImageChanges =
        removedImageIds.length > 0 ||
        Object.keys(replacements).length > 0 ||
        newFiles.length > 0;

      let imageProblems = [];

      if (hasImageChanges) {
        if (destinationId === undefined) {
          imageProblems = [
            "The server didn't return the new destination's id, so the photos weren't uploaded. Reload the page and add them by editing the destination.",
          ];
        } else {
          setImageNotice("");
          imageProblems = await applyImageChanges(destinationId);
          activeImageIdRef.current = destinationId;
          await refreshImages(destinationId);
        }
      }

      if (saved && saved.id !== undefined) {
        if (wasEditing) {
          setDestinations((prev) =>
            prev.map((item) => (item.id === saved.id ? saved : item))
          );
        } else {
          setDestinations((prev) => [
            saved,
            ...prev.filter((item) => item.id !== saved.id),
          ]);
          updateTotal(totalRef.current + 1);
        }
      } else {
        await fetchDestinations();
      }

      if (imageProblems.length > 0) {
        if (!wasEditing && destinationId !== undefined) {
          setEditingId(destinationId);
        }

        setFormError(
          `The destination was saved, but some photo changes failed: ${imageProblems
            .map((problem) => (/[.!?]$/.test(problem) ? problem : `${problem}.`))
            .join(" ")} Press Save to try them again.`
        );
      } else {
        closeForm();
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (destination) => {
    try {
      setError("");

      const response = await deleteDestination(destination.id);

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.detail || "Failed to delete destination");
      }

      setDestinations((prev) =>
        prev.filter((item) => item.id !== destination.id)
      );
      updateTotal(Math.max(0, totalRef.current - 1));
      updatePaged(Math.max(0, pagedCountRef.current - 1));
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) {
      return;
    }

    setDeleting(true);
    await handleDelete(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="admin-home">
      <button
        type="button"
        className="admin-logout-button"
        onClick={() => setShowLogoutConfirm(true)}
      >
        <LogOut size={16} aria-hidden="true" />
        Logout
      </button>

      <header className="admin-home-header">
        <div>
          <span className="admin-home-eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            WAYFARER ADMIN
          </span>

          <h1>Destination Management</h1>

          <p>
            Manage the destinations available on Wayfarer.
          </p>
        </div>


        <button
          type="button"
          className="admin-add-button"
          onClick={openAddForm}
        >
          <Plus size={17} aria-hidden="true" />
          Add Destination
        </button>
      </header>

      <main className="admin-home-content">
        <div className="admin-destination-count">
          <MapPinned size={15} aria-hidden="true" />
          <strong>{total.toLocaleString()}</strong>{" "}
          {total === 1 ? "destination" : "destinations"}
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
                aria-label="Close form"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <PhotoManager
                  existing={existingImages}
                  removedIds={removedImageIds}
                  replacements={replacements}
                  newFiles={newFiles}
                  loading={imagesLoading}
                  loadError={imagesError}
                  notice={imageNotice}
                  slotsLeft={imageSlotsLeft}
                  keptCount={keptImageCount}
                  disabled={submitting}
                  onAddFiles={addImageFiles}
                  onRemoveExisting={removeExistingImage}
                  onUndoRemove={(id) =>
                    setRemovedImageIds((prev) => prev.filter((x) => x !== id))
                  }
                  onReplace={replaceImageFile}
                  onUndoReplace={undoReplaceImage}
                  onRemoveNew={(key) =>
                    setNewFiles((prev) => prev.filter((i) => i.key !== key))
                  }
                />

                <div className="admin-form-field">
                  <label htmlFor="name">
                    <Compass size={15} aria-hidden="true" />
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Munnar"
                    required
                    minLength={LIMITS.name.min}
                    maxLength={LIMITS.name.max}
                    autoComplete="off"
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="location">
                    <MapPin size={15} aria-hidden="true" />
                    Location
                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Kerala"
                    required
                    minLength={LIMITS.location.min}
                    maxLength={LIMITS.location.max}
                    autoComplete="off"
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="category">
                    <Tag size={15} aria-hidden="true" />
                    Category
                  </label>

                  <input
                    id="category"
                    name="category"
                    type="text"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Hill Station"
                    required
                    minLength={LIMITS.category.min}
                    maxLength={LIMITS.category.max}
                    autoComplete="off"
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="estimated_cost">
                    <Wallet size={15} aria-hidden="true" />
                    Estimated Cost
                  </label>

                  <input
                    id="estimated_cost"
                    name="estimated_cost"
                    type="number"
                    min={LIMITS.cost.min}
                    max={LIMITS.cost.max}
                    step="0.01"
                    inputMode="decimal"
                    value={formData.estimated_cost}
                    onChange={handleInputChange}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="recommended_min_days">
                    <Clock size={15} aria-hidden="true" />
                    Minimum Trip Days
                  </label>

                  <input
                    id="recommended_min_days"
                    name="recommended_min_days"
                    type="number"
                    min={LIMITS.days.min}
                    max={LIMITS.days.max}
                    step="1"
                    inputMode="numeric"
                    value={formData.recommended_min_days}
                    onChange={handleInputChange}
                    placeholder="e.g. 2"
                    required
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="recommended_max_days">
                    <Clock size={15} aria-hidden="true" />
                    Maximum Trip Days
                  </label>

                  <input
                    id="recommended_max_days"
                    name="recommended_max_days"
                    type="number"
                    min={formData.recommended_min_days || LIMITS.days.min}
                    max={LIMITS.days.max}
                    step="1"
                    inputMode="numeric"
                    value={formData.recommended_max_days}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="admin-form-field-full">
                  <label>
                    <CalendarDays size={15} aria-hidden="true" />
                    Suitable Months
                    <span className="admin-field-hint">Select at least one</span>
                  </label>

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
                  <label>
                    <Heart size={15} aria-hidden="true" />
                    Interests
                    <span className="admin-field-hint">Select at least one</span>
                  </label>

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
                  <label htmlFor="description">
                    <FileText size={15} aria-hidden="true" />
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the destination..."
                    rows="5"
                    required
                    minLength={LIMITS.description.min}
                    maxLength={LIMITS.description.max}
                  />

                  <span className="admin-char-count" aria-hidden="true">
                    {formData.description.length}/{LIMITS.description.max}
                  </span>
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
                  <X size={16} aria-hidden="true" />
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-save-button"
                  disabled={submitting}
                >
                  {!submitting && <Check size={16} aria-hidden="true" />}
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

        {!loading && !error && destinations.length > 0 && (
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={17} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, location, category or description"
                aria-label="Search destinations"
                maxLength={100}
              />

              {search && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>

            <FilterSelect
              icon={<SlidersHorizontal size={15} />}
              label="Filter by category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "", label: "All categories" },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />

            <FilterSelect
              icon={<ArrowUpDown size={15} />}
              label="Sort destinations"
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
            />

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-toolbar-reset"
                onClick={clearFilters}
              >
                <X size={14} aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        )}

        {!loading && !error && destinations.length > 0 && (
          <div className="admin-results-summary" role="status">
            {hasActiveFilters ? (
              <>
                <span>
                  {filteredDestinations.length.toLocaleString()}{" "}
                  {filteredDestinations.length === 1 ? "match" : "matches"}
                  {hasMore
                    ? ` among the ${destinations.length.toLocaleString()} destinations loaded so far (of ${total.toLocaleString()})`
                    : ` among all ${total.toLocaleString()} destinations`}
                </span>

                {hasMore && (
                  <button
                    type="button"
                    className="admin-secondary-button admin-load-all-button"
                    onClick={loadAll}
                    disabled={loadingAll}
                  >
                    {loadingAll
                      ? `Loading ${pagedCount.toLocaleString()} of ${total.toLocaleString()}...`
                      : "Load all to search everything"}
                  </button>
                )}
              </>
            ) : (
              <span>
                {hasMore
                  ? `Showing ${destinations.length.toLocaleString()} of ${total.toLocaleString()} destinations`
                  : `Showing all ${total.toLocaleString()} ${
                      total === 1 ? "destination" : "destinations"
                    }`}
              </span>
            )}
          </div>
        )}

        {!loading && !error && (
          <section className="admin-destination-list">
            {destinations.length === 0 ? (
              <div className="admin-message">
                <p>No destinations found.</p>

                <button
                  type="button"
                  className="admin-add-button"
                  onClick={openAddForm}
                >
                  <Plus size={17} aria-hidden="true" />
                  Add your first destination
                </button>
              </div>
            ) : filteredDestinations.length === 0 ? (
              <div className="admin-message">
                <p>
                  {hasMore
                    ? "No matches in the destinations loaded so far."
                    : "No destinations match your search or filters."}
                </p>

                <div className="admin-message-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={clearFilters}
                  >
                    <X size={15} aria-hidden="true" />
                    Reset search and filters
                  </button>

                  {hasMore && (
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={loadAll}
                      disabled={loadingAll}
                    >
                      {loadingAll
                        ? `Loading ${pagedCount.toLocaleString()} of ${total.toLocaleString()}...`
                        : "Load all to search everything"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              visibleDestinations.map((destination) => (
                <article
                  className="admin-destination-card"
                  key={destination.id}
                  onClick={() => openDestination(destination.id)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openDestination(destination.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${destination.name}`}
                >
                  <CardImage
                    destination={destination}
                    images={imagesByDestination[destination.id]}
                    onNeedImages={ensureImages}
                  />

                  <div className="admin-destination-main">
                    <div className="admin-destination-top">
                      <span className="admin-destination-category">
                        {destination.category}
                      </span>

                      <span className="admin-destination-location">
                        <MapPin size={14} aria-hidden="true" />
                        <span>{destination.location}</span>
                      </span>
                    </div>

                    <h2>{destination.name}</h2>

                    <p className="admin-destination-description">
                      {destination.description}
                    </p>

                    <div className="admin-destination-details">
                      <div>
                        <span>
                          <Wallet size={13} aria-hidden="true" />
                          Estimated cost
                        </span>
                        <strong>
                          ₹{destination.estimated_cost}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <CalendarDays size={13} aria-hidden="true" />
                          Best time
                        </span>
                        <strong>
                          {destination.best_time_to_visit}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <Clock size={13} aria-hidden="true" />
                          Duration
                        </span>
                        <strong>
                          {destination.recommended_min_days} -{" "}
                          {destination.recommended_max_days} days
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-destination-actions">
                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditForm(destination);
                      }}
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(destination);
                      }}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {!loading && !error && destinations.length > 0 && (
          <div className="admin-load-footer" ref={sentinelRef}>
            {loadMoreError ? (
              <>
                <span>{loadMoreError}</span>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={loadMore}
                >
                  Try again
                </button>
              </>
            ) : loadingMore && !loadingAll ? (
              <span className="admin-load-status">
                <span className="admin-spinner" aria-hidden="true" />
                Loading more...
              </span>
            ) : hasMore && !hasActiveFilters ? (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={loadMore}
              >
                Load more
              </button>
            ) : !hasMore && !hasActiveFilters ? (
              <span>You've reached the end.</span>
            ) : null}
          </div>
        )}
      </main>
    
      {showLogoutConfirm && (
        <ConfirmDialog
          icon={<LogOut size={24} />}
          title="Log out?"
          description="Are you sure you want to log out of the Wayfarer admin panel?"
          confirmLabel="Yes, Logout"
          confirmIcon={<LogOut size={16} aria-hidden="true" />}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={24} />}
          title="Delete destination?"
          description={`Are you sure you want to delete “${deleteTarget.name}”? This action can't be undone.`}
          confirmLabel={deleting ? "Deleting..." : "Yes, Delete"}
          confirmIcon={!deleting && <Trash2 size={16} aria-hidden="true" />}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

export default AdminHome;