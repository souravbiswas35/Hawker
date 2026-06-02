import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiClock,
  FiDownload,
  FiFile,
  FiInfo,
  FiMessageSquare,
  FiRefreshCw,
  FiUploadCloud,
  FiChevronRight,
  FiPlusCircle,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorComplaintTrackingPage.css";

const complaintCategories = [
  "All Categories",
  "Zone issue",
  "License problem",
  "Payment issue",
  "Harassment",
  "Illegal eviction",
  "Others",
];

const statusLabels = {
  new: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "new", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function dateTimeLabel(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString();
}

function statusBadge(status) {
  const colors = {
    new: "status-pill status-open",
    in_progress: "status-pill status-progress",
    resolved: "status-pill status-resolved",
    closed: "status-pill status-closed",
  };
  return <span className={colors[status] || colors.new}>{statusLabels[status] || "Open"}</span>;
}

export default function VendorComplaintTrackingPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "", category: "All Categories", search: "" });
  const [followUp, setFollowUp] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      const { data } = await api.get("/vendor/complaints", { params });
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (filters.category !== "All Categories" && complaint.category !== filters.category) {
        return false;
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        return (
          complaint.subject.toLowerCase().includes(term) ||
          complaint.complaint_ref.toLowerCase().includes(term) ||
          complaint.description.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [complaints, filters.category, filters.search]);

  const counts = useMemo(() => {
    return complaints.reduce(
      (acc, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, new: 0, in_progress: 0, resolved: 0, closed: 0 },
    );
  }, [complaints]);

  const loadDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setDetailLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.get(`/vendor/complaints/${complaint.id}`);
      setDetailData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaint details.");
      setSelectedComplaint(null);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilter = async (e) => {
    e.preventDefault();
    fetchComplaints();
    setSelectedComplaint(null);
    setDetailData(null);
  };

  const clearFilters = () => {
    setFilters({ status: "", category: "All Categories", search: "" });
    setSelectedComplaint(null);
    setDetailData(null);
    fetchComplaints();
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.post(`/vendor/complaints/${selectedComplaint.id}/follow-up`, {
        comment: followUp.trim(),
      });

      setFollowUp("");
      setSuccess("Follow-up added successfully.");
      await loadDetails(selectedComplaint);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add follow-up.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvidenceSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles(files);
  };

  const handleEvidenceUpload = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || evidenceFiles.length === 0) {
      setError("Please choose evidence files to upload.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      evidenceFiles.forEach((file) => {
        formData.append("evidence", file);
      });

      await api.post(
        `/vendor/complaints/${selectedComplaint.id}/evidence`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setEvidenceFiles([]);
      setSuccess("Evidence uploaded successfully.");
      await loadDetails(selectedComplaint);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload evidence.");
    } finally {
      setActionLoading(false);
    }
  };

  const changeStatus = async (action) => {
    if (!selectedComplaint) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const endpoint = action === "close"
        ? `/vendor/complaints/${selectedComplaint.id}/close`
        : `/vendor/complaints/${selectedComplaint.id}/escalate`;

      await api.patch(endpoint);
      setSuccess(
        action === "close"
          ? "Complaint closed successfully."
          : "Complaint escalation request sent."
      );
      await fetchComplaints();
      await loadDetails({ ...selectedComplaint, status: action === "close" ? "closed" : "in_progress" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <VendorLayout>
      <PageTitle
        title="My Complaints Tracking"
        subtitle="Track complaint progress, read admin responses, send follow-ups, and manage evidence from one place."
        icon={FiMessageSquare}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="complaint-tracking-page">
        <div className="complaint-summary-grid mb-4">
          <div className="summary-card summary-total">
            <span className="summary-label">Total Complaints</span>
            <strong>{counts.total}</strong>
          </div>
          <div className="summary-card summary-open">
            <span className="summary-label">Open</span>
            <strong>{counts.new}</strong>
          </div>
          <div className="summary-card summary-progress">
            <span className="summary-label">In Progress</span>
            <strong>{counts.in_progress}</strong>
          </div>
          <div className="summary-card summary-resolved">
            <span className="summary-label">Resolved</span>
            <strong>{counts.resolved}</strong>
          </div>
          <div className="summary-card summary-closed">
            <span className="summary-label">Closed</span>
            <strong>{counts.closed}</strong>
          </div>
        </div>

        <div className="complaint-tracking-panel row gx-4">
          <div className="col-xl-6">
            <div className="panel-box mb-4">
              <div className="panel-header d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5>Complaint list</h5>
                  <p className="text-muted small mb-0">
                    Filter by status or category, then select a complaint for detail view.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchComplaints}
                >
                  <FiRefreshCw className="me-1" /> Refresh
                </button>
              </div>

              <form className="filter-form row g-2 mb-3" onSubmit={applyFilter}>
                <div className="col-sm-6">
                  <select
                    className="form-select"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-6">
                  <select
                    className="form-select"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    {complaintCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-9">
                  <input
                    className="form-control"
                    name="search"
                    placeholder="Search complaints by subject, ID, or description"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-sm-3 d-grid">
                  <button type="submit" className="btn btn-primary">
                    Apply
                  </button>
                </div>
                <div className="col-12 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              </form>

              {loading ? (
                <LoadingState label="Loading complaints..." />
              ) : filteredComplaints.length === 0 ? (
                <div className="alert alert-info mb-0">
                  <FiAlertCircle className="me-2" />
                  No complaints match the current filters.
                </div>
              ) : (
                <div className="complaint-table-wrapper">
                  <table className="table complaint-table mb-0">
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Subject</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Filed</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          className={
                            selectedComplaint?.id === complaint.id ? "table-active" : ""
                          }
                        >
                          <td>{complaint.complaint_ref}</td>
                          <td>{complaint.subject}</td>
                          <td>{complaint.category}</td>
                          <td className="text-capitalize">{complaint.priority}</td>
                          <td>{statusBadge(complaint.status)}</td>
                          <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => loadDetails(complaint)}
                            >
                              View details <FiChevronRight />
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

          <div className="col-xl-6">
            <div className="panel-box detail-panel h-100">
              <div className="panel-header d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5>Complaint details</h5>
                  <p className="text-muted small mb-0">
                    Select a row to see admin comments, follow-up actions, and upload evidence.
                  </p>
                </div>
              </div>

              {detailLoading ? (
                <LoadingState label="Loading details..." />
              ) : !selectedComplaint || !detailData ? (
                <div className="text-center p-5 text-muted">
                  <FiFile className="fs-1 mb-3" />
                  <div>Select a complaint to open its tracking panel.</div>
                </div>
              ) : (
                <div className="detail-content">
                  <div className="detail-card mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6>{detailData.complaint.subject}</h6>
                        <p className="text-muted small mb-1">{detailData.complaint.complaint_ref}</p>
                      </div>
                      {statusBadge(detailData.complaint.status)}
                    </div>
                    <div className="row g-2 mt-3">
                      <div className="col-sm-6">
                        <strong>Category</strong>
                        <div>{detailData.complaint.category}</div>
                      </div>
                      <div className="col-sm-6">
                        <strong>Priority</strong>
                        <div className="text-capitalize">{detailData.complaint.priority}</div>
                      </div>
                      <div className="col-sm-6">
                        <strong>Filed</strong>
                        <div>{dateTimeLabel(detailData.complaint.created_at)}</div>
                      </div>
                      {detailData.complaint.resolved_at && (
                        <div className="col-sm-6">
                          <strong>Resolved</strong>
                          <div>{dateTimeLabel(detailData.complaint.resolved_at)}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <strong>Description</strong>
                      <p className="mb-0">{detailData.complaint.description}</p>
                    </div>
                  </div>

                  {detailData.complaint.resolution_note && (
                    <div className="detail-card mb-3 admin-response">
                      <div className="d-flex align-items-center mb-2">
                        <FiInfo className="me-2" /> <strong>Admin response</strong>
                      </div>
                      <p className="mb-0">{detailData.complaint.resolution_note}</p>
                    </div>
                  )}

                  <div className="detail-card mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <strong>Evidence</strong>
                        <div className="text-muted small">Uploaded support files</div>
                      </div>
                      <span className="badge bg-light text-dark">
                        {detailData.evidence.length} item(s)
                      </span>
                    </div>
                    {detailData.evidence.length === 0 ? (
                      <div className="text-muted">No evidence has been attached yet.</div>
                    ) : (
                      <ul className="list-group evidence-list">
                        {detailData.evidence.map((item) => (
                          <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>
                              <FiDownload className="me-2" />
                              {item.original_name}
                            </span>
                            <span className="text-muted small">{item.file_type}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="detail-card mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <strong>Follow-up history</strong>
                        <div className="text-muted small">Your comments are logged here.</div>
                      </div>
                      <span className="badge bg-light text-dark">
                        {detailData.comments.length}
                      </span>
                    </div>
                    {detailData.comments.length === 0 ? (
                      <div className="text-muted">No follow-up comments yet.</div>
                    ) : (
                      <div className="comment-thread">
                        {detailData.comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-meta text-muted small mb-1">
                              {comment.author_type === "vendor" ? "You" : "Admin"} · {dateTimeLabel(comment.created_at)}
                            </div>
                            <p className="mb-0">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="detail-card action-card">
                    <form onSubmit={handleFollowUpSubmit} className="mb-3">
                      <label className="form-label">Add follow-up comment</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Write a short update or additional detail for the admin team"
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                      />
                      <div className="d-flex gap-2 flex-wrap mt-3">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={actionLoading || followUp.trim().length === 0}
                        >
                          <FiPlusCircle className="me-1" /> Add Follow-up
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={actionLoading}
                          onClick={() => setFollowUp("")}
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    <form onSubmit={handleEvidenceUpload} className="mb-3">
                      <label className="form-label">Upload additional evidence</label>
                      <input
                        type="file"
                        multiple
                        className="form-control"
                        onChange={handleEvidenceSelect}
                      />
                      {evidenceFiles.length > 0 && (
                        <div className="text-muted small mt-2">
                          Selected: {evidenceFiles.map((file) => file.name).join(", ")}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success mt-3"
                        disabled={actionLoading || evidenceFiles.length === 0}
                      >
                        <FiUploadCloud className="me-1" /> Upload Evidence
                      </button>
                    </form>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-outline-danger flex-grow-1"
                        onClick={() => changeStatus("close")}
                        disabled={actionLoading || detailData.complaint.status === "closed"}
                      >
                        Close Complaint
                      </button>
                      <button
                        type="button"
                        className="btn btn-warning flex-grow-1"
                        onClick={() => changeStatus("escalate")}
                        disabled={actionLoading || detailData.complaint.status === "closed"}
                      >
                        Escalate Complaint
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
