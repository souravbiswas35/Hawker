import { useEffect, useState } from "react";
import { FiMapPin, FiZap, FiDroplet, FiSun, FiClock, FiFileText, FiPhone, FiUsers, FiExternalLink, FiEdit, FiSave, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import ZoneDisplayMap from "../../components/maps/ZoneDisplayMap";
import "../../styles/pages/vendor/VendorMyZonePage.css";

// Fix for default marker icon in Leaflet - use custom icon to avoid CDN blocking
const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e74c3c'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
});

export default function VendorMyZonePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoneData, setZoneData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadZoneData() {
      try {
        setLoading(true);
        const res = await api.get("/vendor/my-zone");
        setZoneData(res.data);
        setEditData({
          operating_hours: res.data?.zone?.operating_hours || "",
          rules_regulations: res.data?.zone?.rules_regulations || "",
          zone_in_charge_contact: res.data?.zone?.zone_in_charge_contact || "",
          nearby_landmarks: res.data?.zone?.nearby_landmarks || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load zone information");
      } finally {
        setLoading(false);
      }
    }
    loadZoneData();
  }, []);

  const handleGetDirections = () => {
    if (zoneData?.zone?.latitude && zoneData?.zone?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${zoneData.zone.latitude},${zoneData.zone.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData({
      operating_hours: zoneData?.zone?.operating_hours || "",
      rules_regulations: zoneData?.zone?.rules_regulations || "",
      zone_in_charge_contact: zoneData?.zone?.zone_in_charge_contact || "",
      nearby_landmarks: zoneData?.zone?.nearby_landmarks || "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await api.put("/vendor/my-zone", editData);
      setZoneData({
        ...zoneData,
        zone: {
          ...zoneData.zone,
          ...editData,
        },
      });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update zone details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <LoadingState label="Loading zone information..." />
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <PageTitle
          title="My Zone"
          subtitle="View your assigned vending zone details"
          icon={FiMapPin}
          className="mb-4"
        />
        <div className="alert alert-danger">{error}</div>
      </VendorLayout>
    );
  }

  const { zone, assigned_spot, other_vendors } = zoneData || {};

  return (
    <VendorLayout>
      <PageTitle
        title="My Zone"
        subtitle="View your assigned vending zone details"
        icon={FiMapPin}
        className="mb-4"
      />

      <div className="row g-4">
        {/* Zone Information Card */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <h5 className="mb-4">Zone Information</h5>

              <div className="zone-info-grid">
                <div className="zone-info-item">
                  <span className="zone-info-label">Zone Code</span>
                  <strong className="zone-info-value">{zone?.zone_code || "N/A"}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Zone Name</span>
                  <strong className="zone-info-value">{zone?.name || "N/A"}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Assigned Spot</span>
                  <strong className="zone-info-value">{assigned_spot || "Not assigned"}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Dimensions</span>
                  <strong className="zone-info-value">{zone?.dimensions || "N/A"}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Area</span>
                  <strong className="zone-info-value">{zone?.area || "N/A"}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Total Spots</span>
                  <strong className="zone-info-value">{zone?.total_spots || 0}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Available Spots</span>
                  <strong className="zone-info-value text-success">{zone?.available_spots || 0}</strong>
                </div>
                <div className="zone-info-item">
                  <span className="zone-info-label">Zone Type</span>
                  <strong className="zone-info-value">{zone?.zone_type || "N/A"}</strong>
                </div>
              </div>

              <hr className="my-4" />

              <h6 className="mb-3">Location</h6>
              <p className="text-muted mb-3">{zone?.location || "N/A"}</p>

              {/* Display allocated zone rectangle if available */}
              {zoneData?.zone_rectangle && (
                <div className="mb-3">
                  <h6 className="mb-3">Allocated Zone on Map</h6>
                  <ZoneDisplayMap 
                    zoneBounds={zoneData.zone_rectangle}
                    height="300px"
                    width="100%"
                  />
                </div>
              )}

              {/* Fallback to Leaflet map if zone coordinates are available but no rectangle */}
              {!zoneData?.zone_rectangle && zone?.latitude && zone?.longitude && (
                <div className="mb-3">
                  <MapContainer
                    center={[zone.latitude, zone.longitude]}
                    zoom={15}
                    style={{ height: "300px", width: "100%", borderRadius: "8px" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[zone.latitude, zone.longitude]} icon={customIcon}>
                      <Popup>
                        <strong>{zone.name}</strong><br />
                        {zone.location}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              {zone?.latitude && zone?.longitude && (
                <button
                  className="btn btn-primary"
                  onClick={handleGetDirections}
                >
                  <FiExternalLink className="me-2" />
                  Get Directions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Facilities Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <h5 className="mb-4">Facilities</h5>

              <div className="facilities-list">
                <div className="facility-item">
                  <FiZap className={zone?.has_electricity ? "text-success" : "text-muted"} />
                  <span>Electricity</span>
                  <span className={`badge ${zone?.has_electricity ? "bg-success" : "bg-secondary"}`}>
                    {zone?.has_electricity ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="facility-item">
                  <FiDroplet className={zone?.has_water ? "text-success" : "text-muted"} />
                  <span>Water</span>
                  <span className={`badge ${zone?.has_water ? "bg-success" : "bg-secondary"}`}>
                    {zone?.has_water ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="facility-item">
                  <FiSun className={zone?.has_shade ? "text-success" : "text-muted"} />
                  <span>Shade</span>
                  <span className={`badge ${zone?.has_shade ? "bg-success" : "bg-secondary"}`}>
                    {zone?.has_shade ? "Available" : "Not Available"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours & Rules */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Operating Hours & Rules</h5>
                {!editing && (
                  <button className="btn btn-outline-primary btn-sm" onClick={handleEdit}>
                    <FiEdit className="me-1" />
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <FiClock className="me-2" />
                      Operating Hours
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={editData.operating_hours}
                      onChange={(e) => setEditData({ ...editData, operating_hours: e.target.value })}
                      placeholder="e.g., 8:00 AM - 8:00 PM"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <FiFileText className="me-2" />
                      Rules & Regulations
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={editData.rules_regulations}
                      onChange={(e) => setEditData({ ...editData, rules_regulations: e.target.value })}
                      placeholder="Enter zone rules and regulations"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      <FiSave className="me-1" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <FiX className="me-1" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiClock className="text-primary" />
                      <strong>Operating Hours</strong>
                    </div>
                    <p className="text-muted">{zone?.operating_hours || "Not specified"}</p>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiFileText className="text-primary" />
                      <strong>Rules & Regulations</strong>
                    </div>
                    <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                      {zone?.rules_regulations || "No rules specified"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Nearby */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Contact & Nearby</h5>
                {!editing && (
                  <button className="btn btn-outline-primary btn-sm" onClick={handleEdit}>
                    <FiEdit className="me-1" />
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <FiPhone className="me-2" />
                      Zone In-Charge Contact
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.zone_in_charge_contact}
                      onChange={(e) => setEditData({ ...editData, zone_in_charge_contact: e.target.value })}
                      placeholder="e.g., +8801234567890"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <FiMapPin className="me-2" />
                      Nearby Landmarks
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editData.nearby_landmarks}
                      onChange={(e) => setEditData({ ...editData, nearby_landmarks: e.target.value })}
                      placeholder="Enter nearby landmarks"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      <FiSave className="me-1" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <FiX className="me-1" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiPhone className="text-primary" />
                      <strong>Zone In-Charge Contact</strong>
                    </div>
                    <p className="text-muted">{zone?.zone_in_charge_contact || "Not specified"}</p>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FiMapPin className="text-primary" />
                      <strong>Nearby Landmarks</strong>
                    </div>
                    <p className="text-muted">{zone?.nearby_landmarks || "No landmarks specified"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Other Vendors */}
        <div className="col-12">
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <h5 className="mb-4">
                <FiUsers className="me-2" />
                Other Vendors in Zone
              </h5>

              {other_vendors && other_vendors.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Business Name</th>
                        <th>Assigned Spot</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {other_vendors.map((vendor, index) => (
                        <tr key={index}>
                          <td>{vendor.business_name || "N/A"}</td>
                          <td>{vendor.assigned_spot_number || "Not assigned"}</td>
                          <td>{vendor.email || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">No other vendors in this zone</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
