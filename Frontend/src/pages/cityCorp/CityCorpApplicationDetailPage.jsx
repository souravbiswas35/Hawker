import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiPhone,
  FiMail,
  FiHome,
  FiBriefcase,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/admin/AdminApplicationsPage.css";

export default function CityCorpApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const { data } = await api.get(`/city-corp/applications/${id}`);
      setApplication(data.application);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const finalReview = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/city-corp/applications/${id}/review`, {
        status: reviewData.status,
        remarks: reviewData.remarks,
      });
      setShowReviewModal(false);
      setReviewData({ status: "", remarks: "" });
      loadApplication();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSaving(false);
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
          <LoadingState label="Loading application details..." />
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="alert alert-danger">
            {error || "Application not found"}
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/city-corp/applications")}
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const businessDetails = application.business_details_parsed || {};
  const documentVerification = application.document_verification_parsed || {};

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <PageTitle
          title={`Final Review: ${application.application_ref}`}
          subtitle="Approve or reject license application"
          icon={FiFileText}
          className="mb-4"
        />

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Status Banner */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-2">Application Status</h4>
                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge bg-${
                      application.inspection_status === 'passed' ? 'success' :
                      application.inspection_status === 'failed' ? 'danger' : 'warning'
                    } text-white fs-6`}
                  >
                    Inspection: {application.inspection_status}
                  </span>
                  <span
                    className={`badge bg-${
                      application.city_corp_review_status === 'approved' ? 'success' :
                      application.city_corp_review_status === 'rejected' ? 'danger' : 'warning'
                    } text-white fs-6`}
                  >
                    City Corp Review: {application.city_corp_review_status || "Pending"}
                  </span>
                  <span className="text-muted">
                    Application ID: {application.application_ref}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Inspection Date</div>
                <div className="fw-bold">{formatDate(application.inspection_date)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Vendor Information */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="mb-3">Vendor Information</h5>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FiUser className="text-muted me-2" />
                    <label className="text-muted small me-2">Name:</label>
                    <span className="fw-bold">
                      {application.first_name} {application.last_name}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMail className="text-muted me-2" />
                    <label className="text-muted small me-2">Email:</label>
                    <span className="fw-bold">{application.email}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiPhone className="text-muted me-2" />
                    <label className="text-muted small me-2">Phone:</label>
                    <span className="fw-bold">{application.phone || "Not provided"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiHome className="text-muted me-2" />
                    <label className="text-muted small me-2">Address:</label>
                    <span className="fw-bold">{application.address || "Not provided"}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FiBriefcase className="text-muted me-2" />
                    <label className="text-muted small me-2">Business Name:</label>
                    <span className="fw-bold">{application.business_name || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="mb-3">Application Details</h5>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FiFileText className="text-muted me-2" />
                    <label className="text-muted small me-2">License Type:</label>
                    <span className="fw-bold">{application.license_type_name || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMapPin className="text-muted me-2" />
                    <label className="text-muted small me-2">Primary Zone:</label>
                    <span className="fw-bold">{application.primary_zone_name || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMapPin className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspection Zone:</label>
                    <span className="fw-bold">{application.inspection_zone || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiCalendar className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspection Date:</label>
                    <span className="fw-bold">{formatDate(application.inspection_date)}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiUser className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspector:</label>
                    <span className="fw-bold">{application.inspector_employee_id || "Not assigned"}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FiFileText className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspector Phone:</label>
                    <span className="fw-bold">{application.inspector_phone || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        {Object.keys(businessDetails).length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Business Details</h5>
              <div className="row g-3">
                {Object.entries(businessDetails).map(([key, value]) => (
                  <div key={key} className="col-md-6">
                    <div className="mb-2">
                      <label className="text-muted small">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </label>
                      <div className="fw-bold">{value || "Not provided"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Document Verification */}
        {Object.keys(documentVerification).length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Document Verification</h5>
              <div className="row g-3">
                {Object.entries(documentVerification).map(([key, value]) => (
                  <div key={key} className="col-md-6">
                    <div className="mb-2">
                      <label className="text-muted small">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </label>
                      <div className="fw-bold">
                        {value.uploaded ? "Uploaded" : "Pending"}
                      </div>
                      {value.fileName && (
                        <small className="text-muted">{value.fileName}</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inspection Remarks */}
        {application.inspection_remarks && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Inspection Remarks</h5>
              <div className="alert alert-info">
                {application.inspection_remarks}
              </div>
            </div>
          </div>
        )}

        {/* Admin Review Remarks */}
        {application.admin_review_remarks && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Admin Review Remarks</h5>
              <div className="alert alert-info">
                {application.admin_review_remarks}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {application.inspection_status === 'passed' && (!application.city_corp_review_status || application.city_corp_review_status === 'pending') && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="mb-3">Actions</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowReviewModal(true)}
                >
                  <FiCheckCircle className="me-2" />
                  Final Review
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/city-corp/applications")}
                >
                  Back to Applications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final Review Modal */}
        {showReviewModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowReviewModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Final Review - {application.application_ref}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowReviewModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Review Decision</label>
                    <select
                      className="form-select"
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="">Select Decision</option>
                      <option value="approved">Approve - Issue License</option>
                      <option value="rejected">Reject Application</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={reviewData.remarks}
                      onChange={(e) => setReviewData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Provide detailed remarks for your decision..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={finalReview}
                    disabled={saving || !reviewData.status}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="me-2" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
