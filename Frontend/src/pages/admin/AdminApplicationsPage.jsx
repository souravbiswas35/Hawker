import { useEffect, useState } from "react";
import {
  FiCheckSquare,
  FiEye,
  FiUser,
  FiMapPin,
  FiFile,
  FiCalendar,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: "", remarks: "" });

  async function fetchApplications() {
    try {
      const { data } = await api.get("/admin/applications");
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status, remarks) => {
    setSavingId(id);
    setError("");
    try {
      await api.patch(`/admin/applications/${id}/review`, {
        status,
        remarks: remarks || `Marked as ${status}`,
      });
      await fetchApplications();
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewData({ status: "", remarks: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  const openReviewModal = async (application) => {
    try {
      console.log("Opening review modal for application:", application);
      // Fetch detailed application data
      const { data } = await api.get(`/admin/applications/${application.id}`);
      console.log("Application details response:", data);
      setSelectedApplication(data.application);
      setReviewData({
        status: data.application.status || "",
        remarks: data.application.admin_remarks || "",
      });
      setShowReviewModal(true);
    } catch (err) {
      console.error("Error loading application details:", err);
      setError(
        err.response?.data?.message || "Failed to load application details",
      );
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedApplication(null);
    setReviewData({ status: "", remarks: "" });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!selectedApplication) return;
    updateStatus(selectedApplication.id, reviewData.status, reviewData.remarks);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "submitted":
        return "warning";
      case "needs-info":
        return "info";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <PageTitle
        title="Review Applications"
        subtitle="Approve, reject, or request more information"
        icon={FiCheckSquare}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <LoadingState label="Loading applications for review..." />
      ) : null}

      {!loading ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Application Ref</th>
                    <th>Vendor Details</th>
                    <th>Business Info</th>
                    <th>Zone & Stall</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="fw-bold">{app.application_ref}</div>
                        <small className="text-muted">ID: {app.id}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-2">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">{app.email}</div>
                            <small className="text-muted">
                              {app.business_name || "Not provided"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold">
                            {app.business_category || "Not specified"}
                          </div>
                          <small className="text-muted">
                            {app.stall_type || "Standard"}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiMapPin className="text-muted me-1" />
                          <span>{app.desired_zone || "Not specified"}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusColor(app.status)} text-white`}
                        >
                          {app.status?.replace("-", " ")}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar className="text-muted me-1" />
                          <small>{formatDate(app.submitted_at)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openReviewModal(app)}
                          >
                            <FiEye className="me-1" /> Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FiEye className="me-2" />
                  Review Application {selectedApplication.application_ref}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReviewModal}
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Vendor Information</h6>
                    <div className="mb-3">
                      <label className="text-muted small">Email</label>
                      <div className="fw-bold">{selectedApplication.email}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Name</label>
                      <div className="fw-bold">
                        {selectedApplication.first_name}{" "}
                        {selectedApplication.last_name}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Phone</label>
                      <div className="fw-bold">
                        {selectedApplication.phone || "Not provided"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Business Name</label>
                      <div className="fw-bold">
                        {selectedApplication.business_name || "Not provided"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Address</label>
                      <div className="fw-bold">
                        {selectedApplication.address || "Not provided"}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Application Details</h6>
                    <div className="mb-3">
                      <label className="text-muted small">License Type</label>
                      <div className="fw-bold">
                        {selectedApplication.license_type_name ||
                          "Not specified"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Primary Zone</label>
                      <div className="fw-bold">
                        {selectedApplication.primary_zone_name ||
                          "Not specified"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Alternate Zone</label>
                      <div className="fw-bold">
                        {selectedApplication.alternate_zone_name || "None"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">
                        Business Category
                      </label>
                      <div className="fw-bold">
                        {selectedApplication.business_category ||
                          "Not specified"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Stall Type</label>
                      <div className="fw-bold">
                        {selectedApplication.stall_type || "Standard"}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">
                        Application Ref
                      </label>
                      <div className="fw-bold">
                        {selectedApplication.application_ref}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Steps Progress */}
                <div className="mt-4">
                  <h6 className="text-muted mb-3">Application Progress</h6>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="text-center p-3 border rounded">
                        <div
                          className={`mb-2 ${selectedApplication.license_type_id ? "text-success" : "text-muted"}`}
                        >
                          <FiCheckSquare className="fs-4" />
                        </div>
                        <small>License Type</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 border rounded">
                        <div
                          className={`mb-2 ${selectedApplication.primary_zone_id ? "text-success" : "text-muted"}`}
                        >
                          <FiMapPin className="fs-4" />
                        </div>
                        <small>Zone Selection</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 border rounded">
                        <div
                          className={`mb-2 ${selectedApplication.business_details ? "text-success" : "text-muted"}`}
                        >
                          <FiUser className="fs-4" />
                        </div>
                        <small>Business Details</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3 border rounded">
                        <div
                          className={`mb-2 ${selectedApplication.document_verification ? "text-success" : "text-muted"}`}
                        >
                          <FiFile className="fs-4" />
                        </div>
                        <small>Documents</small>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Review Status</label>
                    <select
                      className="form-select"
                      value={reviewData.status}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="needs-info">Needs More Information</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reviewData.remarks}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      placeholder="Provide detailed feedback to the vendor..."
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReviewModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleReviewSubmit}
                  disabled={
                    savingId === selectedApplication.id || !reviewData.status
                  }
                >
                  {savingId === selectedApplication.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck className="me-2" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
