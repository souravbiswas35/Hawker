import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiMapPin,
  FiEye,
  FiFileText,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function InspectorDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [scheduledInspections, setScheduledInspections] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get("/inspector/dashboard");
      setStats(data.stats);
      setScheduledInspections(data.scheduledInspections || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "warning";
      case "conducted":
        return "info";
      case "passed":
        return "success";
      case "failed":
        return "danger";
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
          title="Inspector Dashboard"
          subtitle="Manage field inspections"
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
                      <FiCalendar className="text-warning fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Scheduled</div>
                      <div className="fw-bold fs-4">{stats.scheduled_inspections || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                      <FiClock className="text-info fs-4" />
                    </div>
                    <div>
                      <div className="text-muted small">Pending</div>
                      <div className="fw-bold fs-4">{stats.pending_inspections || 0}</div>
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
                      <div className="text-muted small">Passed</div>
                      <div className="fw-bold fs-4">{stats.passed_inspections || 0}</div>
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
                      <div className="text-muted small">Failed</div>
                      <div className="fw-bold fs-4">{stats.failed_inspections || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Inspections */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Scheduled Inspections</h5>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => navigate("/inspector/inspections")}
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledInspections.map((inspection) => (
                    <tr key={inspection.id}>
                      <td>
                        <div className="fw-bold">{inspection.application_ref}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-2">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">{inspection.email}</div>
                            <small className="text-muted">
                              {inspection.first_name} {inspection.last_name}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">{inspection.business_name || "N/A"}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiMapPin className="text-muted me-1" />
                          <span>{inspection.primary_zone_name || inspection.inspection_zone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <span>{formatDate(inspection.inspection_date)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusColor(inspection.inspection_status)} text-white`}
                        >
                          {inspection.inspection_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/inspector/inspections/${inspection.id}`)}
                        >
                          <FiEye className="me-1" /> Conduct
                        </button>
                      </td>
                    </tr>
                  ))}
                  {scheduledInspections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No scheduled inspections
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
                    <th>Inspection Status</th>
                    <th>Conducted At</th>
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
                          className={`badge bg-${getStatusColor(activity.inspection_status)} text-white`}
                        >
                          {activity.inspection_status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <span>{formatDate(activity.inspection_conducted_at)}</span>
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
