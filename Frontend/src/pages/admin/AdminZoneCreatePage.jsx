import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import api from "../../api/client";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminZoneCreatePage.css";

export default function AdminZoneCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    zoneCode: "",
    name: "",
    location: "",
    area: "",
    totalSpots: "",
    zoneType: "mixed",
    trafficLevel: "medium",
    hasElectricity: true,
    hasWater: true,
    hasShade: true,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/zones-management", {
        ...form,
        totalSpots: Number(form.totalSpots),
      });
      navigate("/admin/zones-management");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create zone");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Add New Zone Site</h4>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="panel-box">
        <h5 className="mb-3">Add New Zone To Database</h5>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-4">
            <label className="form-label">Zone Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Zone ID</label>
            <input
              className="form-control"
              value={form.zoneCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, zoneCode: e.target.value }))
              }
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Total Slots</label>
            <input
              className="form-control"
              type="number"
              min="1"
              value={form.totalSpots}
              onChange={(e) =>
                setForm((p) => ({ ...p, totalSpots: e.target.value }))
              }
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Zone Area</label>
            <input
              className="form-control"
              value={form.area}
              onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Location</label>
            <input
              className="form-control"
              value={form.location}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Zone Type</label>
            <select
              className="form-select"
              value={form.zoneType}
              onChange={(e) =>
                setForm((p) => ({ ...p, zoneType: e.target.value }))
              }
            >
              <option value="commercial">Commercial</option>
              <option value="residential">Residential</option>
              <option value="mixed">Mixed</option>
              <option value="transport">Transport</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Traffic Level</label>
            <select
              className="form-select"
              value={form.trafficLevel}
              onChange={(e) =>
                setForm((p) => ({ ...p, trafficLevel: e.target.value }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label d-block">Facilities</label>
            {[
              ["hasElectricity", "Electricity"],
              ["hasShade", "Shade"],
              ["hasWater", "Water"],
            ].map(([key, label]) => (
              <label key={key} className="form-check form-check-inline me-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.checked }))
                  }
                />
                <span className="form-check-label">{label}</span>
              </label>
            ))}
          </div>
          <div className="col-12 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/zones-management")}
            >
              Back To Zone Management
            </button>
            <button className="btn btn-warning" disabled={saving}>
              <FiPlusCircle className="me-2" />
              {saving ? "Adding..." : "Add This Zone"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
