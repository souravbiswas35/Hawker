import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiMessageSquare,
  FiMapPin,
  FiClipboard,
  FiArrowRight,
  FiActivity,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminDashboardPage.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function formatBDT(val) {
  const n = Number(val) || 0;
  if (n >= 100000) return `Taka ${(n / 100000).toFixed(1)} Lakh`;
  if (n >= 1000) return `Taka ${(n / 1000).toFixed(1)}K`;
  return `Taka ${n}`;
}

function activityLabel(item) {
  const name = item.first_name
    ? `${item.first_name} ${item.last_name || ""}`.trim()
    : item.email;
  switch (item.action_type) {
    case "approved":
      return `${name} was approved for license`;
    case "rejected":
      return `${name}'s application was rejected`;
    case "needs-info":
      return `${name}'s application needs more info`;
    default:
      return `${name} submitted new license application`;
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState({
    stats: {},
    recentApplications: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => setData(data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  const s = data.stats;

  return (
    <AdminLayout>
      {/* Header strip */}
      <div className="admin-dash-header mb-4">
        <h4 className="mb-0 fw-bold">Admin Dashboard</h4>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <LoadingState label="Loading dashboard..." />}

      {!loading && (
        <>
          {/* Welcome banner */}
          <div className="admin-dash-welcome mb-4">
            <p className="mb-3 fw-semibold">
              Welcome back! Here's what's happening today.
            </p>
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <div className="admin-stat-card mint">
                  <div className="d-flex justify-content-between align-items-start">
                    <FiUsers size={28} className="text-dark" />
                    <span className="admin-stat-badge mint">+12%</span>
                  </div>
                  <div className="admin-stat-value text-dark">
                    {(s.total_vendors || 0).toLocaleString()}
                  </div>
                  <div className="admin-stat-label text-dark">
                    Total Vendors Registered
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="admin-stat-card coral">
                  <div className="d-flex justify-content-between align-items-start">
                    <FiFileText size={28} className="text-dark" />
                    <span className="admin-stat-badge coral">Urgent</span>
                  </div>
                  <div className="admin-stat-value text-dark">
                    {s.pending_applications || 0}
                  </div>
                  <div className="admin-stat-label text-dark">Pending Applications</div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="admin-stat-card yellow">
                  <div className="d-flex justify-content-between align-items-start">
                    <FiDollarSign size={28} className="text-dark" />
                    <span className="admin-stat-badge yellow">This Month</span>
                  </div>
                  <div className="admin-stat-value text-dark">
                    {formatBDT(s.revenue_this_month)}
                  </div>
                  <div className="admin-stat-label text-dark">Revenue Collected</div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="admin-stat-card apple">
                  <div className="d-flex justify-content-between align-items-start">
                    <FiCheckCircle size={28} className="text-dark" />
                    <span className="admin-stat-badge apple">+8%</span>
                  </div>
                  <div className="admin-stat-value text-dark">
                    {(s.approved_licenses || 0).toLocaleString()}
                  </div>
                  <div className="admin-stat-label text-dark">Licenses Issued</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="admin-secondary-card">
                <div className="admin-secondary-icon orange">
                  <FiAlertCircle />
                </div>
                <div>
                  <div className="admin-secondary-label">Expired Licenses</div>
                  <div className="admin-secondary-value text-danger">
                    {s.expired_licenses || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="admin-secondary-card">
                <div className="admin-secondary-icon purple">
                  <FiMessageSquare />
                </div>
                <div>
                  <div className="admin-secondary-label">
                    Pending Complaints
                  </div>
                  <div className="admin-secondary-value text-warning">
                    {s.needs_info_count || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="admin-secondary-card">
                <div className="admin-secondary-icon pink">
                  <FiMapPin />
                </div>
                <div>
                  <div className="admin-secondary-label">Available Zones</div>
                  <div className="admin-secondary-value text-success">
                    {s.available_zones || 0}/{s.total_zones || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="admin-secondary-card">
                <div className="admin-secondary-icon blue">
                  <FiClipboard />
                </div>
                <div>
                  <div className="admin-secondary-label">Inspection Today</div>
                  <div className="admin-secondary-value text-primary">0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="panel-box mb-4">
            <h6 className="fw-bold mb-3">Quick Actions</h6>
            <div className="row g-3">
              {[
                { label: "Review Application", to: "/admin/applications" },
                { label: "View Report", to: "/admin/analytics" },
                { label: "Schedule Inspection", to: "/admin/inspections" },
                { label: "Approve Payments", to: "/admin/payments" },
              ].map((a) => (
                <div className="col-md-6" key={a.label}>
                  <Link to={a.to} className="admin-quick-action">
                    <span>{a.label}</span>
                    <FiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="panel-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                <FiActivity className="me-2 text-primary" />
                Recent Activity
              </h6>
              <Link
                to="/admin/applications"
                className="btn btn-sm btn-outline-primary"
              >
                View All
              </Link>
            </div>

            {data.recentActivity.length > 0 ? (
              <div className="row g-2">
                {data.recentActivity.map((item, i) => (
                  <div className="col-md-6" key={i}>
                    <div className="admin-activity-item">
                      <div className="admin-activity-dot" />
                      <div className="flex-grow-1 min-w-0">
                        <div className="admin-activity-text">
                          {activityLabel(item)}
                        </div>
                        <small className="text-muted">
                          {timeAgo(item.created_at)}
                        </small>
                      </div>
                      <Link
                        to={`/admin/applications`}
                        className="btn btn-sm admin-activity-btn"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* fallback: show recent applications */
              <div className="row g-2">
                {data.recentApplications.slice(0, 6).map((item) => (
                  <div className="col-md-6" key={item.id}>
                    <div className="admin-activity-item">
                      <div className="admin-activity-dot" />
                      <div className="flex-grow-1 min-w-0">
                        <div className="admin-activity-text">
                          {item.first_name
                            ? `${item.first_name} ${item.last_name || ""}`.trim()
                            : item.email}{" "}
                          submitted new license application
                        </div>
                        <small className="text-muted">
                          {timeAgo(item.submitted_at)}
                        </small>
                      </div>
                      <Link
                        to="/admin/applications"
                        className="btn btn-sm admin-activity-btn"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
                {data.recentApplications.length === 0 && (
                  <div className="col-12 text-muted">No activity yet.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
