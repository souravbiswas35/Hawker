import { useEffect, useRef, useState } from "react";
import { FiMapPin, FiX, FiCheck, FiSearch } from "react-icons/fi";
import { MapContainer, TileLayer, Rectangle, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Component to handle map center changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

// Custom hook for drawing rectangles
function RectangleDrawer({ onRectangleComplete, initialBounds }) {
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const map = useMapEvents({
    click(e) {
      if (!drawing) {
        setDrawing(true);
        setStartPoint(e.latlng);
        setCurrentRect([e.latlng, e.latlng]);
      } else {
        setDrawing(false);
        if (currentRect) {
          const bounds = currentRect;
          const rectangleBounds = {
            north: Math.max(bounds[0].lat, bounds[1].lat),
            south: Math.min(bounds[0].lat, bounds[1].lat),
            east: Math.max(bounds[0].lng, bounds[1].lng),
            west: Math.min(bounds[0].lng, bounds[1].lng),
          };
          onRectangleComplete(rectangleBounds);
        }
        setStartPoint(null);
        setCurrentRect(null);
      }
    },
    mousemove(e) {
      if (drawing && startPoint) {
        setCurrentRect([startPoint, e.latlng]);
      }
    },
  });

  return currentRect ? (
    <Rectangle
      bounds={currentRect}
      pathOptions={{ color: "#4285f4", fillColor: "#4285f4", fillOpacity: 0.3 }}
    />
  ) : null;
}

export default function ZoneSelectionMap({ 
  isOpen, 
  onClose, 
  onSave, 
  initialBounds = null,
  defaultCenter = [23.8103, 90.4125] // Dhaka coordinates
}) {
  const [currentBounds, setCurrentBounds] = useState(null);
  const [error, setError] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (initialBounds) {
      setCurrentBounds(initialBounds);
      // Calculate center from bounds
      const centerLat = (initialBounds.north + initialBounds.south) / 2;
      const centerLng = (initialBounds.east + initialBounds.west) / 2;
      setMapCenter([centerLat, centerLng]);
    }
  }, [initialBounds]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setShowSearchResults(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
        setError("No results found for your search.");
      }
    } catch (err) {
      setError("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    const newCenter = [parseFloat(location.lat), parseFloat(location.lon)];
    setMapCenter(newCenter);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleRectangleComplete = (bounds) => {
    setCurrentBounds(bounds);
  };

  const handleSave = () => {
    if (currentBounds) {
      onSave(currentBounds);
      onClose();
    } else {
      setError("Please draw a rectangle on the map before saving.");
    }
  };

  const handleClear = () => {
    setCurrentBounds(null);
  };

  const getLeafletBounds = () => {
    if (!currentBounds) return null;
    return [
      [currentBounds.south, currentBounds.west],
      [currentBounds.north, currentBounds.east],
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <FiMapPin className="me-2" />
              Select Zone on Map
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-3 position-relative">
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <div className="flex-grow-1 position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search for a location (e.g., Dhanmondi, Gulshan, etc.)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div 
                      className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                      style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
                    >
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-2 cursor-pointer hover-bg-light"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectLocation(result)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                        >
                          <div className="fw-bold">{result.display_name.split(',')[0]}</div>
                          <small className="text-muted">{result.display_name}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={searchLoading}
                >
                  <FiSearch className="me-2" />
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            <div style={{ height: "500px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <MapController center={mapCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RectangleDrawer 
                  onRectangleComplete={handleRectangleComplete}
                  initialBounds={initialBounds}
                />
                {currentBounds && (
                  <Rectangle
                    bounds={getLeafletBounds()}
                    pathOptions={{ 
                      color: "#4285f4", 
                      fillColor: "#4285f4", 
                      fillOpacity: 0.3,
                      weight: 2 
                    }}
                  />
                )}
              </MapContainer>
            </div>

            {currentBounds && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">Selected Zone Bounds:</h6>
                <div className="row g-2">
                  <div className="col-md-6">
                    <small className="text-muted">North:</small>
                    <div className="fw-bold">{currentBounds.north.toFixed(6)}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">South:</small>
                    <div className="fw-bold">{currentBounds.south.toFixed(6)}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">East:</small>
                    <div className="fw-bold">{currentBounds.east.toFixed(6)}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">West:</small>
                    <div className="fw-bold">{currentBounds.west.toFixed(6)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <small className="text-muted">
                <strong>Instructions:</strong> Search for a location using the search bar, then click on the map to start drawing a rectangle. 
                Click again to complete the rectangle. The rectangle will show the allocated zone area. You can clear and redraw if needed.
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={handleClear}>
              <FiX className="me-2" />
              Clear
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={!currentBounds}
            >
              <FiCheck className="me-2" />
              Save Zone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
