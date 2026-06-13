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
import ZoneSelectionMap from "../../components/maps/ZoneSelectionMap";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: "", remarks: "" });
  const [reviewStep, setReviewStep] = useState(null); // 'document' or 'admin'
  const [inspectors, setInspectors] = useState([]);
  const [inspectionData, setInspectionData] = useState({ inspectorId: "", inspectionDate: "", inspectionZone: "" });
  const [showZoneMap, setShowZoneMap] = useState(false);
  const [zoneRectangle, setZoneRectangle] = useState(null);
  const [savingZone, setSavingZone] = useState(false);

  // Predefined remarks based on status
  const statusRemarks = {
    approved: "Application approved. License will be issued shortly.",
    rejected: "Application rejected. Please review the requirements and reapply.",
    "needs-info": "Application requires additional information. Please provide the requested documents.",
  };

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

  async function fetchInspectors() {
    try {
      const { data } = await api.get("/admin/inspectors");
      setInspectors(data.inspectors || []);
    } catch (err) {
      console.error("Failed to load inspectors:", err);
    }
  }

  useEffect(() => {
    fetchApplications();
    fetchInspectors();
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

  const verifyDocuments = async (id, status, remarks) => {
    setSavingId(id);
    setError("");
    try {
      await api.post(`/admin/applications/${id}/verify-documents`, {
        status,
        remarks: remarks || `Documents ${status}`,
      });
      await fetchApplications();
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewData({ status: "", remarks: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify documents");
    } finally {
      setSavingId(null);
    }
  };

  const adminReviewWithInspection = async (id, status, remarks, inspectorId, inspectionDate, inspectionZone) => {
    setSavingId(id);
    setError("");
    try {
      await api.post(`/admin/applications/${id}/admin-review`, {
        status,
        remarks,
        inspectorId,
        inspectionDate,
        inspectionZone,
      });
      await fetchApplications();
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewData({ status: "", remarks: "" });
      setInspectionData({ inspectorId: "", inspectionDate: "", inspectionZone: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete admin review");
    } finally {
      setSavingId(null);
    }
  };

  const openReviewModal = async (application, step) => {
    try {
      console.log("Opening review modal for application:", application, "step:", step);
      // Fetch detailed application data
      const { data } = await api.get(`/admin/applications/${application.id}`);
      console.log("Application details response:", data);
      setSelectedApplication(data.application);
      setReviewStep(step);

      if (step === 'document') {
        setReviewData({
          status: data.application.document_verification_status || "",
          remarks: data.application.document_verification_remarks || "",
        });
      } else if (step === 'admin') {
        setReviewData({
          status: data.application.admin_review_status || "",
          remarks: data.application.admin_review_remarks || "",
        });
        setInspectionData({
          inspectorId: data.application.inspection_assigned_to || "",
          inspectionDate: data.application.inspection_date || "",
          inspectionZone: data.application.inspection_zone || data.application.desired_zone || "",
        });
      } else {
        // Legacy single-step review
        const initialStatus = data.application.status || "";
        setReviewData({
          status: initialStatus,
          remarks: data.application.admin_remarks || (initialStatus ? statusRemarks[initialStatus] : ""),
        });
      }
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
    setReviewStep(null);
    setInspectionData({ inspectorId: "", inspectionDate: "", inspectionZone: "" });
  };

  const openZoneMap = async () => {
    if (!selectedApplication) return;
    
    try {
      const { data } = await api.get(`/admin/applications/${selectedApplication.id}/zone-rectangle`);
      setZoneRectangle(data.zoneRectangle);
      setShowZoneMap(true);
    } catch (err) {
      console.error("Error loading zone rectangle:", err);
      setZoneRectangle(null);
      setShowZoneMap(true);
    }
  };

  const handleZoneSave = async (bounds) => {
    if (!selectedApplication) return;
    
    setSavingZone(true);
    setError("");
    try {
      await api.put(`/admin/applications/${selectedApplication.id}/zone-rectangle`, {
        zoneRectangle: bounds,
      });
      setZoneRectangle(bounds);
      setShowZoneMap(false);
      // Refresh application details to show updated zone
      const { data } = await api.get(`/admin/applications/${selectedApplication.id}`);
      setSelectedApplication(data.application);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save zone rectangle");
    } finally {
      setSavingZone(false);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!selectedApplication) return;

    if (reviewStep === 'document') {
      verifyDocuments(selectedApplication.id, reviewData.status, reviewData.remarks);
    } else if (reviewStep === 'admin') {
      adminReviewWithInspection(
        selectedApplication.id,
        reviewData.status,
        reviewData.remarks,
        inspectionData.inspectorId,
        inspectionData.inspectionDate,
        inspectionData.inspectionZone
      );
    } else {
      // Legacy single-step review
      updateStatus(selectedApplication.id, reviewData.status, reviewData.remarks);
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setReviewData((prev) => ({
      ...prev,
      status: newStatus,
      remarks: statusRemarks[newStatus] || prev.remarks,
    }));
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
      case "pending":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getDocumentStatusColor = (status) => {
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

  const getAdminReviewStatusColor = (status) => {
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
                    <th>Document Status</th>
                    <th>Admin Review</th>
                    <th>Inspection</th>
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
                          className={`badge bg-${getDocumentStatusColor(app.document_verification_status)} text-white`}
                        >
                          {app.document_verification_status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getAdminReviewStatusColor(app.admin_review_status)} text-white`}
                        >
                          {app.admin_review_status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getStatusColor(app.inspection_status)} text-white`}
                        >
                          {app.inspection_status || "Pending"}
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
                          {(!app.document_verification_status || app.document_verification_status === 'pending') && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => openReviewModal(app, 'document')}
                              type="button"
                            >
                              <FiCheck className="me-1" /> Verify Docs
                            </button>
                          )}
                          {app.document_verification_status === 'approved' && (!app.admin_review_status || app.admin_review_status === 'pending') && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openReviewModal(app, 'admin')}
                              type="button"
                            >
                              <FiEye className="me-1" /> Admin Review
                            </button>
                          )}
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => openReviewModal(app)}
                            type="button"
                          >
                            <FiEye className="me-1" /> View
                          </button>
                        </div>
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
      ) : null}

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeReviewModal();
            }
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FiEye className="me-2" />
                  {reviewStep === 'document' ? 'Verify Documents' : reviewStep === 'admin' ? 'Admin Review & Assign Inspector' : 'Review Application'} - {selectedApplication.application_ref}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReviewModal}
                  aria-label="Close"
                />
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
                    <div className="mb-3" id="license-type-section">
                      <label className="text-muted small">License Type</label>
                      <div className="fw-bold">
                        {selectedApplication.license_type_name ||
                          "Not specified"}
                      </div>
                    </div>
                    <div className="mb-3" id="zone-selection-section">
                      <label className="text-muted small">Primary Zone</label>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="fw-bold">
                          {selectedApplication.primary_zone_name ||
                            "Not specified"}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={openZoneMap}
                        >
                          <FiMapPin className="me-1" />
                          Select Zone on Map
                        </button>
                      </div>
                      {selectedApplication.zone_rectangle && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small className="text-muted">Allocated Zone:</small>
                          <div className="small text-success">
                            ✓ Zone allocated on map
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small">Alternate Zone</label>
                      <div className="fw-bold">
                        {selectedApplication.alternate_zone_name || "None"}
                      </div>
                    </div>
                    <div className="mb-3" id="business-details-section">
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
                    <div className="mb-3" id="documents-section">
                      <label className="text-muted small">Document Verification</label>
                      <div className="fw-bold">
                        {selectedApplication.document_verification_status || "Pending"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Steps Progress */}
                <div className="mt-4">
                  <h6 className="text-muted mb-3">Application Progress</h6>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div
                        className="text-center p-3 border rounded progress-step"
                        onClick={() => {
                          const element = document.getElementById('license-type-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`mb-2 ${selectedApplication.license_type_id ? "text-success" : "text-muted"}`}
                        >
                          <FiCheckSquare className="fs-4" />
                        </div>
                        <small>License Type</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div
                        className="text-center p-3 border rounded progress-step"
                        onClick={() => {
                          const element = document.getElementById('zone-selection-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`mb-2 ${selectedApplication.primary_zone_id ? "text-success" : "text-muted"}`}
                        >
                          <FiMapPin className="fs-4" />
                        </div>
                        <small>Zone Selection</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div
                        className="text-center p-3 border rounded progress-step"
                        onClick={() => {
                          const element = document.getElementById('business-details-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`mb-2 ${selectedApplication.business_details ? "text-success" : "text-muted"}`}
                        >
                          <FiUser className="fs-4" />
                        </div>
                        <small>Business Details</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div
                        className="text-center p-3 border rounded progress-step"
                        onClick={() => {
                          const element = document.getElementById('documents-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`mb-2 ${selectedApplication.document_verification_status === 'approved' ? "text-success" : "text-muted"}`}
                        >
                          <FiFile className="fs-4" />
                        </div>
                        <small>Documents</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-step review form */}
                {reviewStep === 'document' && (
                  <form onSubmit={handleReviewSubmit} className="mt-4">
                    <h6 className="mb-3">Document Verification</h6>
                    <div className="mb-3">
                      <label className="form-label">Verification Status</label>
                      <select
                        className="form-select"
                        value={reviewData.status}
                        onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
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
                        placeholder="Provide feedback on document verification..."
                      />
                    </div>
                  </form>
                )}

                {reviewStep === 'admin' && (
                  <form onSubmit={handleReviewSubmit} className="mt-4">
                    <h6 className="mb-3">Admin Review & Inspector Assignment</h6>
                    <div className="mb-3">
                      <label className="form-label">Review Status</label>
                      <select
                        className="form-select"
                        value={reviewData.status}
                        onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="approved">Approved - Assign to Inspector</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    {reviewData.status === 'approved' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Assign Inspector</label>
                          <select
                            className="form-select"
                            value={inspectionData.inspectorId}
                            onChange={(e) => setInspectionData(prev => ({ ...prev, inspectorId: e.target.value }))}
                            required
                          >
                            <option value="">Select Inspector</option>
                            {inspectors.map(inspector => (
                              <option key={inspector.user_id} value={inspector.user_id}>
                                {inspector.employee_id} - {inspector.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Inspection Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={inspectionData.inspectionDate}
                            onChange={(e) => setInspectionData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Inspection Zone</label>
                          <input
                            type="text"
                            className="form-control"
                            value={inspectionData.inspectionZone}
                            onChange={(e) => setInspectionData(prev => ({ ...prev, inspectionZone: e.target.value }))}
                            placeholder="Enter inspection zone"
                          />
                        </div>
                      </>
                    )}
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
                        placeholder="Provide feedback on admin review..."
                      />
                    </div>
                  </form>
                )}

                {!reviewStep && (
                  <form onSubmit={handleReviewSubmit} className="mt-4">
                    <div className="mb-3">
                      <label className="form-label">Review Status</label>
                      <select
                        className="form-select"
                        value={reviewData.status}
                        onChange={handleStatusChange}
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
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeReviewModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleReviewSubmit}
                  disabled={
                    savingId === selectedApplication.id || !reviewData.status ||
                    (reviewStep === 'admin' && reviewData.status === 'approved' && !inspectionData.inspectorId)
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
                      {reviewStep === 'document' ? 'Submit Verification' : reviewStep === 'admin' ? 'Submit Review & Assign' : 'Submit Review'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Selection Map Modal */}
      <ZoneSelectionMap
        isOpen={showZoneMap}
        onClose={() => setShowZoneMap(false)}
        onSave={handleZoneSave}
        initialBounds={zoneRectangle}
      />
    </AdminLayout>
  );
}
