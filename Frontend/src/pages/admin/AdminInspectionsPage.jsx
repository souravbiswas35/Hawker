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
  const [data, setData] = useState({ todayInspections: 0, completed: 0, upcoming: 0, violations: 0 });
  const [schedule, setSchedule] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [zones, setZones] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [form, setForm] = useState({
    vendorUserId: "",
    zoneCode: "",
    inspectorName: "",
    scheduledAt: "",
    notes: "",
  });

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    setForm((p) => ({ ...p, vendorUserId: vendorId }));

    // Auto-fill zone based on selected vendor's primary_zone_id
    const selectedVendor = vendors.find((v) => v.id === Number(vendorId));
    if (selectedVendor && selectedVendor.primary_zone_id) {
      // Find zone by ID from zones list
      const zone = zones.find((z) => z.id === selectedVendor.primary_zone_id);
      if (zone) {
        setForm((p) => ({ ...p, zoneCode: zone.name }));
      } else {
        setForm((p) => ({ ...p, zoneCode: "" }));
      }
    } else if (selectedVendor && selectedVendor.vending_zone) {
      // Fallback to vending_zone if primary_zone_id is not available
      setForm((p) => ({ ...p, zoneCode: selectedVendor.vending_zone }));
    } else {
      setForm((p) => ({ ...p, zoneCode: "" }));
    }
  };

  async function load() {
    try {
      const { data: metrics } = await api.get("/admin/inspections/dashboard-metrics");
      setData(metrics);

      const { data: scheduleData } = await api.get("/admin/inspections/today-schedule");
      setSchedule(scheduleData.schedule || []);

      const { data: vendorsData } = await api.get("/admin/vendors");
      setVendors(vendorsData.vendors || []);

      const { data: zonesData } = await api.get("/admin/zones-management");
      setZones(zonesData.zones || []);

      const { data: inspectorsData } = await api.get("/admin/inspections/inspectors");
      setInspectors(inspectorsData.inspectors || []);
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
      await api.post("/admin/inspections/schedule", {
        vendorId: Number(form.vendorUserId),
        inspectorId: Number(form.inspectorName),
        scheduledDate: form.scheduledAt,
        templateId: null,
        type: "routine",
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
                <h3>{data.todayInspections || 0}</h3>
                <p>Today's Inspections</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-green">
                <h3>{data.completed || 0}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-teal">
                <h3>{data.upcoming || 0}</h3>
                <p>Upcoming</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-red">
                <h3>{data.violations || 0}</h3>
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
                <select
                  className="form-control"
                  value={form.vendorUserId}
                  onChange={handleVendorChange}
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.first_name} {v.last_name} - {v.business_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-control"
                  value={form.zoneCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, zoneCode: e.target.value }))
                  }
                  required
                >
                  <option value="">Select Zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-control"
                  value={form.inspectorName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, inspectorName: e.target.value }))
                  }
                  required
                >
                  <option value="">Select Inspector</option>
                  {inspectors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.email} ({i.employee_id})
                    </option>
                  ))}
                </select>
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
              {schedule.map((s) => (
                <div key={s.id} className="admin-list-item">
                  <div>
                    <div className="fw-semibold">
                      {new Date(s.scheduled_date).toLocaleString()}
                    </div>
                    <div className="small text-muted">
                      {s.first_name
                        ? `${s.first_name} ${s.last_name || ""}`.trim()
                        : s.email || "Unknown vendor"}{" "}
                      • {s.zone_name || "Unknown zone"}
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
              {schedule.length === 0 && (
                <div className="text-muted">No inspections scheduled.</div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
