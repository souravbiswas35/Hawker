import { useState, useEffect } from "react";
import { FiCalendar, FiCheck, FiAlertTriangle, FiDownload, FiImage, FiPhone, FiFileText, FiClock, FiUser, FiShield, FiMapPin } from "react-icons/fi";
import VendorLayout from "../../components/layout/VendorLayout";
import PageTitle from "../../components/common/PageTitle";
import api from "../../api/client";
import "../../styles/pages/vendor/VendorInspectionHistoryPage.css";

export default function VendorInspectionHistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await api.get("/vendor/inspection-history");
        setInspections(res.data.inspections || []);
      } catch (err) {
        console.error("Failed to load inspection history:", err);
        // Don't set error state - just show empty state
        setInspections([]);
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "passed":
        return "status-passed";
      case "minor_issues":
        return "status-warning";
      case "warnings":
        return "status-warning";
      case "failed":
        return "status-failed";
      default:
        return "status-pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "passed":
        return "Passed";
      case "minor_issues":
        return "Minor Issues";
      case "warnings":
        return "Warnings";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const handleDownloadReport = async (inspectionId) => {
    try {
      alert("Downloading inspection report...");
      // Simulate PDF download
      console.log("Downloading report for inspection:", inspectionId);
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  const handleViewPhotos = (inspection) => {
    setSelectedInspection(inspection);
    setShowPhotosModal(true);
  };

  const handleCallInspector = (contactNumber) => {
    window.open(`tel:${contactNumber}`);
  };

  // Calculate metrics
  const totalInspections = inspections.length;
  const passedInspections = inspections.filter(i => i.outcome === "passed").length;
  const warningInspections = inspections.filter(i => i.outcome === "minor_issues" || i.outcome === "warnings").length;
  const avgComplianceRate = inspections.length > 0
    ? Math.round(inspections.reduce((sum, i) => sum + (i.compliance_rate || 0), 0) / inspections.length)
    : 0;

  // Get upcoming inspection
  const upcomingInspection = inspections.find(i => i.status === "scheduled");

  if (loading) {
    return (
      <VendorLayout>
        <div className="inspection-loading">Loading inspection history...</div>
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <div className="inspection-error">{error}</div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <PageTitle
        title="Inspection History"
        subtitle="View your inspection records and compliance status"
        icon={FiShield}
      />

      <div className="inspection-history-container">
        {/* Metric Summary Cards */}
        <div className="metrics-row">
          <div className="metric-card metric-cyan">
            <div className="metric-label">Total Inspections</div>
            <div className="metric-value">{totalInspections}</div>
          </div>
          <div className="metric-card metric-green">
            <div className="metric-label">Passed</div>
            <div className="metric-value">{passedInspections}</div>
          </div>
          <div className="metric-card metric-red">
            <div className="metric-label">Warnings</div>
            <div className="metric-value">{warningInspections}</div>
          </div>
          <div className="metric-card metric-blue">
            <div className="metric-label">Compliance Rate</div>
            <div className="metric-value">{avgComplianceRate}%</div>
          </div>
        </div>

        {/* Upcoming Inspection Alert */}
        {upcomingInspection && (
          <div className="upcoming-alert">
            <div className="alert-icon">
              <FiCalendar />
            </div>
            <div className="alert-content">
              <div className="alert-title">Upcoming Inspection Scheduled</div>
              <div className="alert-details">
                <span className="alert-date">{formatDate(upcomingInspection.scheduled_date)}</span>
                <span className="alert-divider">|</span>
                <span className="alert-type">{upcomingInspection.type.replace(/_/g, " ").toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Cards List */}
        <div className="inspections-list">
          {inspections.length === 0 ? (
            <div className="no-inspections">
              <FiFileText className="no-inspections-icon" />
              <p>No inspection records found</p>
              <p className="no-inspections-hint">
                Inspection feature requires database setup. Run Backend/sql/25_inspections_schema.sql to enable.
              </p>
            </div>
          ) : (
            inspections.map((inspection) => (
              <div key={inspection.id} className="inspection-card">
                <div className="inspection-card-left">
                  <div className="inspection-header">
                    <div className="inspection-type">
                      {inspection.type.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div className={`inspection-status ${getStatusColor(inspection.outcome)}`}>
                      {getStatusLabel(inspection.outcome)}
                    </div>
                  </div>
                  <div className="inspection-date">
                    <FiClock />
                    {formatDate(inspection.scheduled_date)}
                  </div>

                  {/* Inspector Info */}
                  {inspection.inspector_name && (
                    <div className="inspector-card">
                      <div className="inspector-avatar">
                        <FiUser />
                      </div>
                      <div className="inspector-details">
                        <div className="inspector-name">{inspection.inspector_name}</div>
                        <div className="inspector-rank">{inspection.inspector_rank}</div>
                        <div className="inspector-badge">#{inspection.badge_number}</div>
                      </div>
                      {inspection.inspector_contact && (
                        <button
                          className="call-inspector-btn"
                          onClick={() => handleCallInspector(inspection.inspector_contact)}
                        >
                          <FiPhone />
                          Call
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inspection Photos */}
                  {inspection.photos && JSON.parse(inspection.photos).length > 0 && (
                    <div className="inspection-photos">
                      <div className="photos-label">Inspection Photos</div>
                      <div className="photos-grid">
                        {JSON.parse(inspection.photos).slice(0, 4).map((photo, index) => (
                          <div key={index} className="photo-thumbnail">
                            <FiImage />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="inspection-card-right">
                  {/* Checklist */}
                  {inspection.checklist_results && (
                    <div className="inspection-checklist">
                      <div className="checklist-label">Inspection Checklist</div>
                      <div className="checklist-grid">
                        {JSON.parse(inspection.checklist_results).map((item, index) => (
                          <div
                            key={index}
                            className={`checklist-item ${item.status === "Pass" ? "checklist-pass" : "checklist-fail"}`}
                          >
                            {item.item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {inspection.comments && (
                    <div className="inspection-comments">
                      <div className="comments-label">Inspector's Comments</div>
                      <div className="comments-content">{inspection.comments}</div>
                    </div>
                  )}

                  {/* Violations Alert */}
                  {(inspection.outcome === "minor_issues" || inspection.outcome === "warnings") && inspection.violations && (
                    <div className="violations-alert">
                      <FiAlertTriangle />
                      <div className="violations-content">
                        <div className="violations-title">Violations Found</div>
                        <div className="violations-text">{inspection.violations}</div>
                      </div>
                    </div>
                  )}

                  {/* Action Required */}
                  {inspection.action_required && (
                    <div className="action-required">
                      <div className="action-label">Action Required:</div>
                      <div className="action-text">{inspection.action_required}</div>
                    </div>
                  )}

                  {/* Follow-up Date */}
                  {inspection.follow_up_date && (
                    <div className="follow-up-date">
                      <FiCalendar />
                      Follow-up: {formatDate(inspection.follow_up_date)}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="inspection-actions">
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownloadReport(inspection.id)}
                  >
                    <FiDownload />
                    Download Report
                  </button>
                  {inspection.photos && JSON.parse(inspection.photos).length > 0 && (
                    <button
                      className="action-btn photos-btn"
                      onClick={() => handleViewPhotos(inspection)}
                    >
                      <FiImage />
                      View Photos
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Photos Modal */}
      {showPhotosModal && selectedInspection && (
        <div className="modal-overlay" onClick={() => setShowPhotosModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inspection Photos</h3>
              <button className="modal-close" onClick={() => setShowPhotosModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="photos-gallery">
                {JSON.parse(selectedInspection.photos || "[]").map((photo, index) => (
                  <div key={index} className="gallery-photo">
                    <FiImage />
                    <span>Photo {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
