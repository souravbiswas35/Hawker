import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { FiMap, FiSearch } from "react-icons/fi";
import PageTitle from "../components/common/PageTitle";

const zones = [
  {
    id: "ZM-001",
    name: "Central Market Plaza",
    district: "Mirpur",
    lat: 23.8225,
    lng: 90.3654,
    status: "Available",
    occupied: 17,
    capacity: 50,
  },
  {
    id: "ZM-002",
    name: "Jatra Bari Bus Stand",
    district: "Jatrabari",
    lat: 23.7102,
    lng: 90.4475,
    status: "Partial",
    occupied: 22,
    capacity: 30,
  },
  {
    id: "ZM-003",
    name: "University Road",
    district: "Badda",
    lat: 23.7806,
    lng: 90.4255,
    status: "Occupied",
    occupied: 40,
    capacity: 40,
  },
  {
    id: "ZM-004",
    name: "Beach Front MR-10",
    district: "South District",
    lat: 23.7572,
    lng: 90.3841,
    status: "Available",
    occupied: 10,
    capacity: 42,
  },
  {
    id: "ZM-005",
    name: "Metro Point",
    district: "Uttara",
    lat: 23.8759,
    lng: 90.3795,
    status: "Partial",
    occupied: 20,
    capacity: 35,
  },
];

const iconByStatus = {
  Available: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  Partial: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  Occupied: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

export default function ZonesPage() {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("All");
  const [status, setStatus] = useState("All");

  const districts = useMemo(
    () => ["All", ...new Set(zones.map((z) => z.district))],
    [],
  );

  const filtered = useMemo(
    () =>
      zones.filter((zone) => {
        const byQuery =
          zone.name.toLowerCase().includes(query.toLowerCase()) ||
          zone.id.toLowerCase().includes(query.toLowerCase());
        const byDistrict = district === "All" || zone.district === district;
        const byStatus = status === "All" || zone.status === status;
        return byQuery && byDistrict && byStatus;
      }),
    [query, district, status],
  );

  return (
    <main className="public-page">
      <section className="public-hero compact">
        <div className="container py-5 text-center">
          <h1>Vending Zones</h1>
          <p>Explore available vending locations across the city.</p>
        </div>
      </section>

      <section className="container py-4">
        <div className="panel-box">
          <PageTitle
            title="Zone Finder"
            subtitle="Filter zones by district, occupancy, and keyword search"
            icon={FiMap}
            className="mb-3"
          />
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search Zone</label>
              <input
                className="form-control"
                placeholder="Search by name or ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">District / Area</label>
              <select
                className="form-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {districts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Availability</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All</option>
                <option>Available</option>
                <option>Partial</option>
                <option>Occupied</option>
              </select>
            </div>
          </div>
        </div>

        <div className="map-shell mt-4">
          <MapContainer
            center={[23.7808, 90.4106]}
            zoom={12}
            style={{ height: "460px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((zone) => (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={iconByStatus[zone.status]}
              >
                <Popup>
                  <strong>{zone.name}</strong>
                  <br />
                  Zone ID: {zone.id}
                  <br />
                  District: {zone.district}
                  <br />
                  Status: {zone.status}
                  <br />
                  Occupancy: {zone.occupied}/{zone.capacity}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="row g-3 mt-2">
          {filtered.map((zone) => (
            <div className="col-lg-4 col-md-6" key={zone.id}>
              <div className="zone-card">
                <div className="d-flex justify-content-between align-items-start">
                  <h6>{zone.name}</h6>
                  <span
                    className={`badge rounded-pill ${zone.status === "Available" ? "text-bg-success" : zone.status === "Partial" ? "text-bg-warning" : "text-bg-danger"}`}
                  >
                    {zone.status}
                  </span>
                </div>
                <p className="mb-1">Zone ID: {zone.id}</p>
                <p className="mb-1">District: {zone.district}</p>
                <p className="mb-0">
                  <FiSearch className="me-1" />
                  Occupied {zone.occupied} / {zone.capacity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
