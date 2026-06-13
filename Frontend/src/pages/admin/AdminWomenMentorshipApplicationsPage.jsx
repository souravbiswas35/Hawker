import React, { useState, useEffect } from "react";
import { FiCheck, FiX, FiFilter } from "react-icons/fi";
import api from "../../api/client";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminWomenMentorshipApplicationsPage() {
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
      const res = await api.get(
        "/admin/women-support/mentorship-applications",
        { params },
      );
      setApplications(res.data.applications);
      setLoading(false);
    } catch (err) {
      console.error("Error loading applications:", err);
      setLoading(false);
    }
  };

  const handleReview = async (applicationId, reviewAction) => {
    try {
      await api.patch(
        `/admin/women-support/mentorship-applications/${applicationId}/review`,
        {
          action: reviewAction,
          remarks,
        },
      );
      alert(
        `Mentorship request ${reviewAction === "accept" ? "accepted" : reviewAction === "reject" ? "rejected" : "marked as completed"} successfully`,
      );
      setShowModal(false);
      setRemarks("");
      loadApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review application");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      requested: { bg: "bg-warning", text: "Requested" },
      accepted: { bg: "bg-success", text: "Accepted" },
      rejected: { bg: "bg-danger", text: "Rejected" },
      completed: { bg: "bg-info", text: "Completed" },
    };
    const config = statusMap[status] || { bg: "bg-secondary", text: status };
    return <span className={`badge ${config.bg}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "60vh" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Mentorship Applications</h2>
            <p className="text-muted mb-0">
              Women Vendor Support - Manage mentorship requests
            </p>
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
              <option value="requested">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Vendor</th>
                    <th>Mentor</th>
                    <th>Expertise</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No mentorship applications found
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div>
                            <strong>
                              {app.first_name} {app.last_name}
                            </strong>
                            <br />
                            <small className="text-muted">{app.email}</small>
                            {app.business_name && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {app.business_name}
                                </small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>{app.mentor_name}</td>
                        <td>{app.expertise}</td>
                        <td>{app.experience_years} years</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>
                          {new Date(app.requested_at).toLocaleDateString()}
                        </td>
                        <td>
                          {app.status === "requested" && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-success me-1"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setAction("accept");
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
                          {app.status === "accepted" && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setSelectedApplication(app);
                                setAction("complete");
                                setShowModal(true);
                              }}
                            >
                              Mark Complete
                            </button>
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
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {action === "accept"
                      ? "Accept Mentorship Request"
                      : action === "reject"
                        ? "Reject Mentorship Request"
                        : "Mark as Completed"}
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
                  <div className="mb-3">
                    <h6 className="fw-bold">Vendor Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedApplication.first_name}{" "}
                      {selectedApplication.last_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedApplication.email}
                    </p>
                    {selectedApplication.business_name && (
                      <p>
                        <strong>Business:</strong>{" "}
                        {selectedApplication.business_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold">Mentor Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedApplication.mentor_name}
                    </p>
                    <p>
                      <strong>Expertise:</strong>{" "}
                      {selectedApplication.expertise}
                    </p>
                    <p>
                      <strong>Experience:</strong>{" "}
                      {selectedApplication.experience_years} years
                    </p>
                    <p>
                      <strong>Contact:</strong>{" "}
                      {selectedApplication.contact_email}
                    </p>
                  </div>
                  <div>
                    <label className="form-label fw-bold">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks for this decision..."
                    ></textarea>
                  </div>
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
                  <button
                    type="button"
                    className={`btn ${action === "accept" ? "btn-success" : action === "reject" ? "btn-danger" : "btn-primary"}`}
                    onClick={() => handleReview(selectedApplication.id, action)}
                  >
                    {action === "accept"
                      ? "Accept"
                      : action === "reject"
                        ? "Reject"
                        : "Mark Complete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
