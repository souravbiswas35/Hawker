import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUploadCloud,
  FiDownload,
  FiFile,
  FiFlag,
  FiMessageSquare,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorComplaintsPage.css";

const complaintCategories = [
  "Zone issue",
  "License problem",
  "Payment issue",
  "Harassment",
  "Illegal eviction",
  "Others",
];

export default function VendorComplaintsPage() {
  const [section, setSection] = useState("file");
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
    is_anonymous: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/vendor/complaints");
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        id: `${Date.now()}-${Math.random()}`,
      })),
    ]);
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      if (!formData.subject || !formData.category || !formData.description) {
        setError("Subject, category, and description are required");
        return;
      }

      setSubmitting(true);
      setError("");

      const response = await api.post("/vendor/complaints", formData);
      const complaintId = response.data.complaint_id;
      const complaintRef = response.data.complaint_ref;

      // Upload evidence files if any
      if (uploadedFiles.length > 0) {
        const evidenceForm = new FormData();
        uploadedFiles.forEach((item) => {
          evidenceForm.append("evidence", item.file);
        });
        await api.post(`/vendor/complaints/${complaintId}/evidence`, evidenceForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(`Complaint filed successfully! Your reference number is: ${complaintRef}`);
      setFormData({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
        is_anonymous: false,
      });
      setUploadedFiles([]);
      fetchComplaints();

      setTimeout(() => {
        setSuccess("");
        setSection("my");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: { bg: "bg-info", icon: FiAlertCircle, label: "New" },
      in_progress: { bg: "bg-warning", icon: FiClock, label: "In Progress" },
      resolved: { bg: "bg-success", icon: FiCheckCircle, label: "Resolved" },
      closed: { bg: "bg-secondary", icon: FiCheckCircle, label: "Closed" },
    };
    const variant = variants[status] || variants.new;
    const Icon = variant.icon;
    return (
      <span className={`badge ${variant.bg} d-inline-flex align-items-center gap-1`}>
        <Icon className="fs-6" /> {variant.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: "badge-secondary",
      medium: "badge-warning",
      high: "badge-danger",
    };
    return (
      <span className={`badge ${variants[priority] || "badge-secondary"}`}>
        <FiFlag className="me-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Complaint & Grievance Management"
        subtitle="File new complaints and track the status of your existing grievances."
        icon={FiMessageSquare}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="vendor-complaints-page">
        <div className="mb-4 d-flex gap-2">
          <button
            type="button"
            className={`btn btn-lg rounded-3 ${section === "file" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSection("file")}
          >
            <FiMessageSquare className="me-2" /> File New Complaints
          </button>
          <button
            type="button"
            className={`btn btn-lg rounded-3 ${section === "my" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSection("my")}
          >
            <FiUploadCloud className="me-2" /> My Complaints ({complaints.length})
          </button>
        </div>

        {section === "file" ? (
          <div className="file-complaint-section p-4 rounded-4 shadow-sm bg-white">
            <h5 className="mb-3">File a Complaint</h5>
            <p className="text-muted small mb-4">
              Keep it short and descriptive (e.g., "Unauthorized vendor in my zone"). Include
              dates, times, and locations. Upload supporting evidence if available. Choose the correct
              category.
            </p>

            <form onSubmit={submitComplaint}>
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Subject/Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  placeholder="Brief title of your complaint"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Select Complaint Category <span className="text-danger">*</span>
                </label>
                <div className="complaint-categories">
                  {complaintCategories.map((cat) => (
                    <label key={cat} className="complaint-category-btn">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={formData.category === cat}
                        onChange={handleFormChange}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Select Priority Level <span className="text-danger">*</span>
                </label>
                <div className="priority-buttons">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`priority-btn priority-${level} ${
                        formData.priority === level ? "active" : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priority: level }))
                      }
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control rounded-3"
                  placeholder="Describe your complaint in detail. Add dates, times, and relevant information"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleFormChange}
                />
                <div className="text-muted small mt-1">
                  Minimum 10 characters
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Upload Evidence (Optional)</label>
                <div className="upload-evidence-zone rounded-3 border-2 border-dashed p-4 text-center">
                  <FiUploadCloud className="fs-1 text-muted mb-2" />
                  <p className="text-muted mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-muted small mb-3">
                    Photos, video, documents or PDF (Max 5 files, 10 MB each)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="upload-input"
                    accept="image/*,video/*,.pdf"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files mt-3">
                    <h6>Uploaded Files ({uploadedFiles.length})</h6>
                    <ul className="list-group">
                      {uploadedFiles.map((item) => (
                        <li
                          key={item.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>
                            <FiFile className="me-2" />
                            {item.file.name}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeFile(item.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25">
                <label className="form-check d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleFormChange}
                  />
                  <span>
                    <strong>File Anonymous Complaint</strong>
                    <div className="text-muted small">
                      Your identity will not be disclosed. Note: We may still need to contact you for
                      more information on anonymous complaints.
                    </div>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-success btn-lg w-100 rounded-3"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          </div>
        ) : (
          <div className="my-complaints-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>My Complaints</h5>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={fetchComplaints}
              >
                <FiRefreshCw className="me-1" /> Refresh
              </button>
            </div>

            {loading ? (
              <LoadingState label="Loading complaints..." />
            ) : complaints.length === 0 ? (
              <div className="alert alert-info rounded-3">
                <FiAlertCircle className="me-2" />
                No complaints filed yet. Start by clicking "File New Complaints" to lodge a grievance.
              </div>
            ) : (
              <div className="complaints-grid">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="complaint-card p-4 rounded-4 bg-white shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="mb-1">{complaint.subject}</h6>
                        <p className="text-muted small mb-0">{complaint.complaint_ref}</p>
                      </div>
                      <div className="text-end">
                        {getStatusBadge(complaint.status)}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-light text-dark">
                        {complaint.category}
                      </span>
                      {getPriorityBadge(complaint.priority)}
                    </div>

                    <p className="complaint-description text-muted small mb-3">
                      {complaint.description}
                    </p>

                    <div className="complaint-meta text-muted small mb-3">
                      <div>
                        <strong>Filed:</strong> {new Date(complaint.created_at).toLocaleDateString()}
                      </div>
                      {complaint.resolved_at && (
                        <div>
                          <strong>Resolved:</strong> {new Date(complaint.resolved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={() => {
                        /* Open details modal or expand */
                      }}
                    >
                      <FiDownload className="me-1" /> View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
