import { FiMapPin } from "react-icons/fi";
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ZoneDisplayMap({ 
  zoneBounds, 
  height = "300px",
  width = "100%"
}) {
  if (!zoneBounds || !zoneBounds.north || !zoneBounds.south || !zoneBounds.east || !zoneBounds.west) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center bg-light rounded"
        style={{ height, width, border: "2px dashed #dee2e6" }}
      >
        <div className="text-center text-muted">
          <FiMapPin className="fs-1 mb-2" />
          <p className="mb-0">No zone allocated on map</p>
        </div>
      </div>
    );
  }

  // Calculate center of the rectangle
  const centerLat = (zoneBounds.north + zoneBounds.south) / 2;
  const centerLng = (zoneBounds.east + zoneBounds.west) / 2;

  // Convert to Leaflet bounds format
  const leafletBounds = [
    [zoneBounds.south, zoneBounds.west],
    [zoneBounds.north, zoneBounds.east],
  ];

  return (
    <div style={{ height, width, borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        bounds={leafletBounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Rectangle
          bounds={leafletBounds}
          pathOptions={{ 
            color: "#4285f4", 
            fillColor: "#4285f4", 
            fillOpacity: 0.3,
            weight: 2 
          }}
        />
      </MapContainer>
    </div>
  );
}
