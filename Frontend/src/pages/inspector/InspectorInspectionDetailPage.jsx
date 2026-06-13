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

export default function InspectorInspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConductModal, setShowConductModal] = useState(false);
  const [conductData, setConductData] = useState({ status: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInspection();
  }, [id]);

  const loadInspection = async () => {
    try {
      const { data } = await api.get(`/inspector/inspections/${id}`);
      setInspection(data.inspection);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inspection details");
    } finally {
      setLoading(false);
    }
  };

  const conductInspection = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/inspector/inspections/${id}/conduct`, {
        status: conductData.status,
        remarks: conductData.remarks,
      });
      setShowConductModal(false);
      setConductData({ status: "", remarks: "" });
      loadInspection();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to conduct inspection");
    } finally {
      setSaving(false);
    }
  };

  const passToCityCorp = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/inspector/inspections/${id}/pass-to-city-corp`);
      loadInspection();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to pass to City Corporation");
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
          <LoadingState label="Loading inspection details..." />
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="alert alert-danger">
            {error || "Inspection not found"}
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/inspector/inspections")}
          >
            Back to Inspections
          </button>
        </div>
      </div>
    );
  }

  const businessDetails = inspection.business_details_parsed || {};

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <PageTitle
          title={`Inspection: ${inspection.application_ref}`}
          subtitle="Conduct field inspection"
          icon={FiFileText}
          className="mb-4"
        />

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Inspection Status Banner */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-2">Inspection Status</h4>
                <div className="d-flex align-items-center gap-3">
                  <span
                    className={`badge bg-${
                      inspection.inspection_status === 'scheduled' ? 'warning' :
                      inspection.inspection_status === 'conducted' ? 'info' :
                      inspection.inspection_status === 'passed' ? 'success' :
                      inspection.inspection_status === 'failed' ? 'danger' : 'secondary'
                    } text-white fs-6`}
                  >
                    {inspection.inspection_status}
                  </span>
                  <span className="text-muted">
                    Application ID: {inspection.application_ref}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Inspection Date</div>
                <div className="fw-bold">{formatDate(inspection.inspection_date)}</div>
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
                      {inspection.first_name} {inspection.last_name}
                    </span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMail className="text-muted me-2" />
                    <label className="text-muted small me-2">Email:</label>
                    <span className="fw-bold">{inspection.email}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiPhone className="text-muted me-2" />
                    <label className="text-muted small me-2">Phone:</label>
                    <span className="fw-bold">{inspection.phone || "Not provided"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiHome className="text-muted me-2" />
                    <label className="text-muted small me-2">Address:</label>
                    <span className="fw-bold">{inspection.address || "Not provided"}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FiBriefcase className="text-muted me-2" />
                    <label className="text-muted small me-2">Business Name:</label>
                    <span className="fw-bold">{inspection.business_name || "Not provided"}</span>
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
                    <span className="fw-bold">{inspection.license_type_name || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMapPin className="text-muted me-2" />
                    <label className="text-muted small me-2">Primary Zone:</label>
                    <span className="fw-bold">{inspection.primary_zone_name || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiMapPin className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspection Zone:</label>
                    <span className="fw-bold">{inspection.inspection_zone || "Not specified"}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FiCalendar className="text-muted me-2" />
                    <label className="text-muted small me-2">Inspection Date:</label>
                    <span className="fw-bold">{formatDate(inspection.inspection_date)}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <FiFileText className="text-muted me-2" />
                    <label className="text-muted small me-2">Admin Remarks:</label>
                    <span className="fw-bold">{inspection.admin_review_remarks || "None"}</span>
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

        {/* Admin Review Remarks */}
        {inspection.admin_review_remarks && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="mb-3">Admin Review Remarks</h5>
              <div className="alert alert-info">
                {inspection.admin_review_remarks}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {inspection.inspection_status === 'scheduled' && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="mb-3">Actions</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConductModal(true)}
                >
                  <FiCheckCircle className="me-2" />
                  Conduct Inspection
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/inspector/inspections")}
                >
                  Back to Inspections
                </button>
              </div>
            </div>
          </div>
        )}

        {inspection.inspection_status === 'conducted' && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="mb-3">Actions</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={passToCityCorp}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="me-2" />
                      Pass to City Corporation
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/inspector/inspections")}
                >
                  Back to Inspections
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conduct Inspection Modal */}
        {showConductModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowConductModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Conduct Inspection</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowConductModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Inspection Result</label>
                    <select
                      className="form-select"
                      value={conductData.status}
                      onChange={(e) => setConductData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      <option value="">Select Result</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={conductData.remarks}
                      onChange={(e) => setConductData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Provide detailed inspection remarks..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConductModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={conductInspection}
                    disabled={saving || !conductData.status}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="me-2" />
                        Submit Inspection
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
