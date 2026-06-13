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

export default function InspectorInspectionsPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadInspections();
  }, [filterStatus]);

  const loadInspections = async () => {
    try {
      const { data } = await api.get("/inspector/inspections", {
        params: filterStatus ? { status: filterStatus } : {},
      });
      setInspections(data.inspections || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inspections");
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
      case "pending":
        return "secondary";
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
          <LoadingState label="Loading inspections..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <PageTitle
          title="Assigned Inspections"
          subtitle="View and conduct field inspections"
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
                <option value="scheduled">Scheduled</option>
                <option value="conducted">Conducted</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((inspection) => (
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
                          <FiEye className="me-1" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inspections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No inspections found
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
