import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function CityCorpApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      const { data } = await api.get("/city-corp/applications", {
        params: filterStatus ? { status: filterStatus } : {},
      });
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
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
          <LoadingState label="Loading applications..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <PageTitle
          title="Applications for Final Review"
          subtitle="Review and approve license applications"
          icon={FiFileText}
          className="mb-4"
        />

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Filter */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3">
              <label className="mb-0">Filter by Status:</label>
              <select
                className="form-select w-auto"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Application Ref</th>
                    <th>Vendor</th>
                    <th>Business</th>
                    <th>Zone</th>
                    <th>Inspection Date</th>
                    <th>Inspector</th>
                    <th>Inspection Status</th>
                    <th>City Corp Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
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
                        <div className="d-flex align-items-center">
                          <FiMapPin className="text-muted me-1" />
                          <span>{app.primary_zone_name || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <span>{formatDate(app.inspection_date)}</span>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{app.inspector_id || "N/A"}</small>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            app.inspection_status === 'passed' ? 'success' :
                            app.inspection_status === 'failed' ? 'danger' : 'warning'
                          } text-white`}
                        >
                          {app.inspection_status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusColor(app.city_corp_review_status)} text-white`}
                        >
                          {app.city_corp_review_status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/city-corp/applications/${app.id}`)}
                        >
                          <FiEye className="me-1" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        No applications found
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
