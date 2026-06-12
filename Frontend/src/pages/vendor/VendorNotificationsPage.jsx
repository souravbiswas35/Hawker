import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiCircle,
  FiFilter,
  FiSearch,
  FiTrash2,
  FiShield,
  FiMail,
  FiSmartphone,
  FiTool,
  FiBookmark,
  FiEye,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorNotificationsPage.css";

const categories = [
  "All",
  "License updates",
  "Payment reminders",
  "Renewal alerts",
  "Zone changes",
  "Inspection notices",
  "System announcements",
];

const defaultPreferences = {
  email_notifications: true,
  sms_notifications: true,
  push_notifications: false,
  license_updates: true,
  payment_alerts: true,
  renewal_reminders: true,
  zone_changes: true,
  inspection_notices: true,
  system_announcements: true,
};

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (currentCategory !== "All") params.category = currentCategory;
      if (searchText.trim()) params.search = searchText.trim();
      if (statusFilter === "read" || statusFilter === "unread") {
        params.status = statusFilter;
      }
      const { data } = await api.get("/vendor/notifications", { params });
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get("/vendor/notifications/preferences");
      setPreferences(data.preferences || defaultPreferences);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load notification preferences.");
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [currentCategory, searchText, statusFilter]);

  // Real-time notification refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [currentCategory, searchText, statusFilter]);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);
      await api.put("/vendor/notifications/preferences", preferences);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleRead = async (notification) => {
    // Admin notifications cannot be marked as read/unread
    if (notification.source === 'admin' || !notification.source) {
      return;
    }
    
    if (!notification.id || notification.id === 'undefined') {
      setError("Notification ID is missing");
      return;
    }
    
    try {
      await api.patch(
        `/vendor/notifications/${notification.id}/${notification.is_read ? "unread" : "read"}`,
      );
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update notification status.");
    }
  };

  const deleteNotification = async (id, source) => {
    // Admin notifications cannot be deleted
    if (source === 'admin' || !source) {
      return;
    }
    
    if (!id || id === 'undefined') {
      setError("Notification ID is missing");
      return;
    }
    
    try {
      await api.delete(`/vendor/notifications/${id}`, { params: { source } });
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete notification.");
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const categoryCounts = useMemo(() => {
    const counts = categories.reduce((map, category) => {
      if (category !== "All") map[category] = 0;
      return map;
    }, {});
    notifications.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    });
    return counts;
  }, [notifications]);

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      "License updates": { class: "bg-primary", label: "License Updates" },
      "Payment reminders": { class: "bg-success", label: "Payment Reminders" },
      "Renewal alerts": { class: "bg-warning", label: "Renewal Alerts" },
      "Zone changes": { class: "bg-info", label: "Zone Changes" },
      "Inspection notices": { class: "bg-danger", label: "Inspection Notices" },
      "System announcements": { class: "bg-secondary", label: "System Announcements" },
    };
    const config = categoryConfig[category] || categoryConfig["System announcements"];
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Notifications Center"
        subtitle="Manage your vendor alerts, read status, filters, and preferences in one place."
        icon={FiBell}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card notification-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="notification-stat-icon bg-primary">
                  <FiBell size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Total Notifications</h6>
                  <h3 className="mb-0">{notifications.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card notification-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="notification-stat-icon bg-warning">
                  <FiCircle size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Unread</h6>
                  <h3 className="mb-0">{unreadCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card notification-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="notification-stat-icon bg-success">
                  <FiCheckCircle size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Read</h6>
                  <h3 className="mb-0">{notifications.length - unreadCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category} {category !== "All" && `(${categoryCounts[category] || 0})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Search</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search notifications..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Notifications</h5>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchNotifications}
                >
                  <FiFilter className="me-1" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <LoadingState label="Loading notifications..." />
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <FiBell size={48} className="text-muted mb-3" />
                  <h6>No notifications found</h6>
                  <p className="text-muted">There are no notifications matching your criteria.</p>
                </div>
              ) : (
                <div className="notification-list">
                  {notifications.map((note, index) => (
                    <div
                      key={note.id || `notification-${index}`}
                      className={`card notification-card ${note.is_read ? 'read' : 'unread'} mb-3`}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            {!note.is_read && <FiBookmark className="text-warning" />}
                            <h5 className="mb-0">{note.title}</h5>
                          </div>
                          <div className="d-flex gap-2">
                            {getCategoryBadge(note.category)}
                          </div>
                        </div>
                        
                        <p className="notification-message mb-2">
                          {note.message}
                        </p>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-3 text-muted small">
                            <span>
                              <FiCalendar className="me-1" />
                              {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="d-flex gap-2">
                            {note.source !== 'admin' && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => toggleRead(note)}
                              >
                                {note.is_read ? (
                                  <><FiCircle className="me-1" /> Mark unread</>
                                ) : (
                                  <><FiCheckCircle className="me-1" /> Mark read</>
                                )}
                              </button>
                            )}
                            {note.source !== 'admin' && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteNotification(note.id, note.source)}
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card preferences-card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FiShield className="text-primary fs-4" />
                <div>
                  <h5 className="mb-0">Notification Preferences</h5>
                  <div className="text-muted small">Control how you receive alerts</div>
                </div>
              </div>

              <div className="preference-group mb-4">
                <div className="preference-item">
                  <div>
                    <strong>Email Notifications</strong>
                    <div className="text-muted small">Receive notifications by email</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => updatePreference("email_notifications", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div>
                    <strong>SMS Notifications</strong>
                    <div className="text-muted small">Receive important alerts via SMS</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.sms_notifications}
                      onChange={(e) => updatePreference("sms_notifications", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="preference-item">
                  <div>
                    <strong>Push Notifications</strong>
                    <div className="text-muted small">Browser/app push notifications</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.push_notifications}
                      onChange={(e) => updatePreference("push_notifications", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <div className="category-preferences mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiMail className="text-secondary fs-4" />
                  <div>
                    <h5 className="mb-0">Category alerts</h5>
                    <div className="text-muted small">Choose which categories you want to receive notifications for</div>
                  </div>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>License updates</strong>
                    <div className="text-muted small">Get notified about license status changes</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.license_updates}
                      onChange={(e) => updatePreference("license_updates", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>Payment alerts</strong>
                    <div className="text-muted small">Receive payment due notifications</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.payment_alerts}
                      onChange={(e) => updatePreference("payment_alerts", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>Renewal reminders</strong>
                    <div className="text-muted small">Get alerts before license expires</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.renewal_reminders}
                      onChange={(e) => updatePreference("renewal_reminders", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>Zone changes</strong>
                    <div className="text-muted small">Notifications about zone assignments</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.zone_changes}
                      onChange={(e) => updatePreference("zone_changes", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>Inspection notices</strong>
                    <div className="text-muted small">Alerts about scheduled inspections</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.inspection_notices}
                      onChange={(e) => updatePreference("inspection_notices", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="preference-item">
                  <div>
                    <strong>System announcements</strong>
                    <div className="text-muted small">Important system-wide updates</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.system_announcements}
                      onChange={(e) => updatePreference("system_announcements", e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={savePreferences}
                disabled={savingPrefs}
              >
                {savingPrefs ? "Saving preferences..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
