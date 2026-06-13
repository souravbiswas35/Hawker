import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiFileText,
  FiCalendar,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function CityCorpDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get("/city-corp/dashboard");
      setStats(data.stats);
      setPendingReviews(data.pendingReviews || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <LoadingState label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <PageTitle
          title="City Corporation Dashboard"
          subtitle="Final approval for license applications"
          icon={FiFileText}
          className="mb-4"
        />

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Stats Cards */}
        {stats && (
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                      <FiClock className="text-warning fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Pending Reviews</div>
                      <div className="fw-bold fs-4">{stats.pending_reviews || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                      <FiCheckCircle className="text-success fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Approved Today</div>
                      <div className="fw-bold fs-4">{stats.approved_today || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                      <FiFileText className="text-danger fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Rejected Today</div>
                      <div className="fw-bold fs-4">{stats.rejected_today || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                      <FiUser className="text-primary fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Total Licenses</div>
                      <div className="fw-bold fs-4">{stats.total_licenses_issued || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Reviews */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Applications Awaiting Final Review</h5>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => navigate("/city-corp/applications")}
              >
                View All
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Application Ref</th>
                    <th>Vendor</th>
                    <th>Business</th>
                    <th>Zone</th>
                    <th>Inspection Date</th>
                    <th>Inspection Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="fw-bold">{app.application_ref}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-2">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">{app.email}</div>
                            <small className="text-muted">
                              {app.first_name} {app.last_name}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">{app.business_name || "N/A"}</div>
                      </td>
                      <td>
                        <div className="fw-bold">{app.primary_zone_name || "N/A"}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <span>{formatDate(app.inspection_date)}</span>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {app.inspection_remarks || "None"}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/city-corp/applications/${app.id}`)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingReviews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No applications awaiting final review
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h5 className="mb-4">Recent Activity</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Application Ref</th>
                    <th>Vendor</th>
                    <th>Review Status</th>
                    <th>Reviewed At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="fw-bold">{activity.application_ref}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-2">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">{activity.email}</div>
                            <small className="text-muted">
                              {activity.first_name} {activity.last_name}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusColor(activity.city_corp_review_status)} text-white`}
                        >
                          {activity.city_corp_review_status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <span>{formatDate(activity.city_corp_reviewed_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No recent activity
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
