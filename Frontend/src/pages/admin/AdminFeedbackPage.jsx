import { useState, useEffect } from "react";
import { FiStar, FiMessageSquare, FiFilter, FiSearch, FiCheck, FiX, FiEye, FiEdit, FiTrendingUp, FiUsers, FiClock } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminFeedbackPage.css";

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    implemented: 0,
    avgRating: 0
  });

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [filterStatus, filterType]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;

      const { data } = await api.get("/feedback/all", { params });
      setFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
      setError("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/feedback/all", { params: { limit: 1000 } });
      const allFeedbacks = data.feedbacks || [];
      
      setStats({
        total: allFeedbacks.length,
        pending: allFeedbacks.filter(f => f.status === 'pending').length,
        reviewed: allFeedbacks.filter(f => f.status === 'reviewed').length,
        implemented: allFeedbacks.filter(f => f.status === 'implemented').length,
        avgRating: allFeedbacks.length > 0 
          ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1)
          : 0
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleViewFeedback = async (feedbackId) => {
    try {
      const { data } = await api.get(`/feedback/${feedbackId}`);
      setSelectedFeedback(data.feedback);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch feedback details:", err);
      setError("Failed to load feedback details");
    }
  };

  const handleUpdateStatus = async (feedbackId, status, adminResponse) => {
    try {
      await api.put(`/feedback/${feedbackId}`, { status, adminResponse });
      setShowModal(false);
      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error("Failed to update feedback:", err);
      setError("Failed to update feedback status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "bg-warning", label: "Pending" },
      reviewed: { class: "bg-info", label: "Reviewed" },
      implemented: { class: "bg-success", label: "Implemented" },
      declined: { class: "bg-danger", label: "Declined" }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      general: { class: "bg-secondary", label: "General" },
      feature_request: { class: "bg-primary", label: "Feature Request" },
      bug_report: { class: "bg-danger", label: "Bug Report" },
      improvement: { class: "bg-success", label: "Improvement" }
    };
    const config = typeConfig[type] || typeConfig.general;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            className={`star ${star <= rating ? "filled" : ""}`}
          />
        ))}
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        feedback.feedback?.toLowerCase().includes(query) ||
        feedback.user?.email?.toLowerCase().includes(query) ||
        feedback.user?.firstName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageTitle
        title="Feedback Management"
        subtitle="View and manage user feedback"
        icon={FiMessageSquare}
        className="mb-4"
      />

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-primary">
                  <FiMessageSquare size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Total Feedback</h6>
                  <h3 className="mb-0">{stats.total}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-warning">
                  <FiClock size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Pending</h6>
                  <h3 className="mb-0">{stats.pending}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-success">
                  <FiCheck size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Implemented</h6>
                  <h3 className="mb-0">{stats.implemented}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-info">
                  <FiStar size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Avg Rating</h6>
                  <h3 className="mb-0">{stats.avgRating}</h3>
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="implemented">Implemented</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="general">General</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug_report">Bug Report</option>
                <option value="improvement">Improvement</option>
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
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status" />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-5">
              <FiMessageSquare size={48} className="text-muted mb-3" />
              <h6>No feedback found</h6>
              <p className="text-muted">There are no feedbacks matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Type</th>
                    <th>Feedback</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((feedback) => (
                    <tr key={feedback.id}>
                      <td>
                        {feedback.isAnonymous ? (
                          <span className="text-muted">Anonymous</span>
                        ) : (
                          <div>
                            <div className="fw-bold">
                              {feedback.user?.firstName} {feedback.user?.lastName}
                            </div>
                            <small className="text-muted">{feedback.user?.email}</small>
                          </div>
                        )}
                      </td>
                      <td>{renderStars(feedback.rating)}</td>
                      <td>{getTypeBadge(feedback.type)}</td>
                      <td>
                        <div className="feedback-preview">
                          {feedback.feedback.substring(0, 100)}
                          {feedback.feedback.length > 100 && "..."}
                        </div>
                      </td>
                      <td>{getStatusBadge(feedback.status)}</td>
                      <td>
                        <small>{new Date(feedback.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewFeedback(feedback.id)}
                        >
                          <FiEye className="me-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {showModal && selectedFeedback && (
        <div className="modal feedback-modal show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Feedback Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>User:</strong>{' '}
                    {selectedFeedback.isAnonymous ? (
                      <span className="text-muted">Anonymous</span>
                    ) : (
                      <span>
                        {selectedFeedback.user?.firstName} {selectedFeedback.user?.lastName} ({selectedFeedback.user?.email})
                      </span>
                    )}
                  </div>
                  <div className="col-md-6">
                    <strong>Date:</strong>{' '}
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Rating:</strong>{' '}
                    {renderStars(selectedFeedback.rating)}
                  </div>
                  <div className="col-md-6">
                    <strong>Type:</strong>{' '}
                    {getTypeBadge(selectedFeedback.type)}
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Feedback:</strong>
                  <p className="mt-2">{selectedFeedback.feedback}</p>
                </div>

                <div className="mb-3">
                  <strong>Current Status:</strong>{' '}
                  {getStatusBadge(selectedFeedback.status)}
                </div>

                {selectedFeedback.adminResponse && (
                  <div className="mb-3">
                    <strong>Admin Response:</strong>
                    <p className="mt-2 bg-light p-3 rounded">{selectedFeedback.adminResponse}</p>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Update Status</label>
                  <select
                    className="form-select mb-2"
                    defaultValue={selectedFeedback.status}
                    id="statusSelect"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="implemented">Implemented</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Admin Response</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add your response..."
                    defaultValue={selectedFeedback.adminResponse || ""}
                    id="adminResponse"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const status = document.getElementById('statusSelect').value;
                    const adminResponse = document.getElementById('adminResponse').value;
                    handleUpdateStatus(selectedFeedback.id, status, adminResponse);
                  }}
                >
                  <FiCheck className="me-2" />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop show" onClick={() => setShowModal(false)} />
      )}
    </AdminLayout>
  );
}
