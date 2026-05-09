import { useEffect, useState } from "react";
import { FiBell, FiSend, FiClock } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    audienceType: "all_vendors",
    priority: "normal",
    channels: ["in-app", "email"],
  });

  async function fetchData() {
    try {
      const { data } = await api.get("/admin/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const toggleChannel = (name) => {
    setForm((prev) => {
      const exists = prev.channels.includes(name);
      return {
        ...prev,
        channels: exists
          ? prev.channels.filter((c) => c !== name)
          : [...prev.channels, name],
      };
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/notifications", form);
      setForm({
        title: "",
        message: "",
        type: "info",
        audienceType: "all_vendors",
        priority: "normal",
        channels: ["in-app", "email"],
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Notification Management</h4>
        <button className="btn btn-success btn-sm">View History</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading notifications..." /> : null}

      {!loading && (
        <>
          <div className="panel-box mb-4">
            <h5 className="mb-3">Create New Notification</h5>
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-6">
                <label className="form-label">Notification Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Audience</label>
                <select
                  className="form-select"
                  value={form.audienceType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      audienceType: e.target.value,
                    }))
                  }
                >
                  <option value="all_vendors">All Vendors</option>
                  <option value="zone_specific">Specific Zones</option>
                  <option value="license_type">License Type</option>
                  <option value="individual">Individual Vendors</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label d-block">Channels</label>
                {["in-app", "sms", "email", "push"].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className={`btn btn-sm me-2 mb-2 ${form.channels.includes(ch) ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => toggleChannel(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-info text-white" disabled={saving}>
                  <FiSend className="me-2" />{" "}
                  {saving ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel-box">
            <h5 className="mb-3">Recent Notifications</h5>
            <div className="d-grid gap-2">
              {notifications.map((n) => (
                <div key={n.id} className="admin-list-item">
                  <div>
                    <div className="fw-semibold">
                      <FiBell className="me-2 text-primary" />
                      {n.title}
                    </div>
                    <div className="small text-muted">{n.message}</div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success mb-1">Sent</span>
                    <div className="small text-muted">
                      <FiClock className="me-1" />
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-muted">No notifications sent yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
