import { useEffect, useState } from "react";
import { FiCalendar, FiPlusCircle } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminInspectionsPage.css";

export default function AdminInspectionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ stats: {}, schedule: [] });
  const [form, setForm] = useState({
    vendorUserId: "",
    zoneCode: "",
    inspectorName: "",
    scheduledAt: "",
    notes: "",
  });

  async function load() {
    try {
      const { data } = await api.get("/admin/inspections");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createInspection(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/inspections", {
        vendorUserId: Number(form.vendorUserId),
        zoneCode: form.zoneCode,
        inspectorName: form.inspectorName,
        scheduledAt: form.scheduledAt,
        notes: form.notes,
      });
      setForm({
        vendorUserId: "",
        zoneCode: "",
        inspectorName: "",
        scheduledAt: "",
        notes: "",
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule inspection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Inspection & Compliance</h4>
        <button className="btn btn-success btn-sm">
          Schedule New Inspection
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading inspections..." /> : null}

      {!loading && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-blue">
                <h3>{data.stats.today_count || 0}</h3>
                <p>Today's Inspections</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-green">
                <h3>{data.stats.completed_count || 0}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-teal">
                <h3>{data.stats.upcoming_count || 0}</h3>
                <p>Upcoming</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-red">
                <h3>{data.stats.violations_found || 0}</h3>
                <p>Violations Found</p>
              </div>
            </div>
          </div>

          <div className="panel-box mb-4">
            <h5 className="mb-3">
              <FiPlusCircle className="me-2" />
              Schedule Inspection
            </h5>
            <form className="row g-3" onSubmit={createInspection}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Vendor User ID"
                  value={form.vendorUserId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vendorUserId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Zone Code"
                  value={form.zoneCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, zoneCode: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Inspector Name"
                  value={form.inspectorName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, inspectorName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, scheduledAt: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-success" disabled={saving}>
                  {saving ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel-box">
            <h5 className="mb-3">
              <FiCalendar className="me-2" />
              Inspection Schedule
            </h5>
            <div className="d-grid gap-2">
              {data.schedule.map((s) => (
                <div key={s.id} className="admin-list-item">
                  <div>
                    <div className="fw-semibold">
                      {new Date(s.scheduled_at).toLocaleString()}
                    </div>
                    <div className="small text-muted">
                      {s.first_name
                        ? `${s.first_name} ${s.last_name || ""}`.trim()
                        : s.email || "Unknown vendor"}{" "}
                      • Zone {s.zone_code}
                    </div>
                    <div className="small text-muted">
                      Inspector: {s.inspector_name}
                    </div>
                  </div>
                  <span className="badge bg-secondary text-capitalize">
                    {s.status.replace("_", " ")}
                  </span>
                </div>
              ))}
              {data.schedule.length === 0 && (
                <div className="text-muted">No inspections scheduled.</div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
