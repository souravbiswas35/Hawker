import React, { useState, useEffect } from "react";
import { FiCheck, FiX, FiEye, FiFilter } from "react-icons/fi";
import api from "../../api/client";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminWomenSchemeApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const res = await api.get("/admin/women-support/scheme-applications", { params });
      setApplications(res.data.applications);
      setLoading(false);
    } catch (err) {
      console.error("Error loading applications:", err);
      setLoading(false);
    }
  };

  const handleViewDetails = async (applicationId) => {
    try {
      const res = await api.get(`/admin/women-support/scheme-applications/${applicationId}`);
      setSelectedApplication(res.data.application);
      setShowModal(true);
    } catch (err) {
      console.error("Error loading application details:", err);
    }
  };

  const handleReview = async (applicationId, reviewAction) => {
    try {
      await api.patch(`/admin/women-support/scheme-applications/${applicationId}/review`, {
        action: reviewAction,
        remarks,
      });
      alert(`Application ${reviewAction === "approve" ? "approved" : "rejected"} successfully`);
      setShowModal(false);
      setRemarks("");
      loadApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review application");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: "bg-warning", text: "Pending" },
      approved: { bg: "bg-success", text: "Approved" },
      rejected: { bg: "bg-danger", text: "Rejected" },
      under_review: { bg: "bg-info", text: "Under Review" },
    };
    const config = statusMap[status] || { bg: "bg-secondary", text: status };
    return <span className={`badge ${config.bg}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Scheme Applications</h2>
            <p className="text-muted mb-0">Women Vendor Support - Manage scheme applications</p>
          </div>
        <div className="d-flex align-items-center gap-2">
          <FiFilter className="text-muted" />
          <select
            className="form-select form-select-sm"
            style={{ width: "150px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Application Ref</th>
                  <th>Vendor</th>
                  <th>Scheme</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <code>{app.application_ref}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{app.first_name} {app.last_name}</strong>
                          <br />
                          <small className="text-muted">{app.email}</small>
                        </div>
                      </td>
                      <td>{app.scheme_name}</td>
                      <td>৳ {app.scheme_amount?.toLocaleString() || "N/A"}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{new Date(app.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleViewDetails(app.id)}
                        >
                          <FiEye />
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() => {
                                setSelectedApplication(app);
                                setAction("approve");
                                setShowModal(true);
                              }}
                            >
                              <FiCheck />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setSelectedApplication(app);
                                setAction("reject");
                                setShowModal(true);
                              }}
                            >
                              <FiX />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedApplication && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {action ? `${action === "approve" ? "Approve" : "Reject"} Application` : "Application Details"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedApplication(null);
                    setAction("");
                    setRemarks("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Vendor Information</h6>
                    <p><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</p>
                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                    <p><strong>Business:</strong> {selectedApplication.business_name}</p>
                    <p><strong>Business Type:</strong> {selectedApplication.business_type}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Scheme Information</h6>
                    <p><strong>Scheme:</strong> {selectedApplication.scheme_name}</p>
                    <p><strong>Amount:</strong> ৳ {selectedApplication.scheme_amount?.toLocaleString()}</p>
                    <p><strong>Description:</strong> {selectedApplication.scheme_description}</p>
                    <p><strong>Deadline:</strong> {selectedApplication.deadline ? new Date(selectedApplication.deadline).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Application Details</h6>
                    <p><strong>Business Description:</strong> {selectedApplication.business_description || "N/A"}</p>
                    <p><strong>Current Income:</strong> ৳ {selectedApplication.current_income?.toLocaleString() || "N/A"}</p>
                    <p><strong>Business Years:</strong> {selectedApplication.business_years || "N/A"}</p>
                    <p><strong>Employees:</strong> {selectedApplication.employees_count || "N/A"}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Funding Purpose</h6>
                    <p>{selectedApplication.funding_purpose || "N/A"}</p>
                    {selectedApplication.additional_notes && (
                      <>
                        <h6 className="fw-bold mt-3">Additional Notes</h6>
                        <p>{selectedApplication.additional_notes}</p>
                      </>
                    )}
                  </div>
                </div>
                {action && (
                  <div className="mt-3">
                    <label className="form-label fw-bold">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks for this decision..."
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedApplication(null);
                    setAction("");
                    setRemarks("");
                  }}
                >
                  Close
                </button>
                {action && (
                  <button
                    type="button"
                    className={`btn ${action === "approve" ? "btn-success" : "btn-danger"}`}
                    onClick={() => handleReview(selectedApplication.id, action)}
                  >
                    {action === "approve" ? "Approve" : "Reject"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
