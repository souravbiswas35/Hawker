import { useState } from "react";
import { FiPlus, FiUpload, FiX, FiSave } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminAddAnnouncement.css";

export default function AdminAddAnnouncement() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
    priority: "medium",
    publishDate: new Date().toISOString().slice(0, 16),
    expiryDate: ""
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      setError("Content is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("content", formData.content.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("isPinned", formData.isPinned);
      formDataToSend.append("priority", formData.priority);
      formDataToSend.append("publishDate", formData.publishDate);
      if (formData.expiryDate) {
        formDataToSend.append("expiryDate", formData.expiryDate);
      }

      attachments.forEach(file => {
        formDataToSend.append("attachments", file);
      });

      await api.post("/announcements", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSuccess("Announcement created successfully!");
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        category: "general",
        isPinned: false,
        priority: "medium",
        publishDate: new Date().toISOString().slice(0, 16),
        expiryDate: ""
      });
      setAttachments([]);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to create announcement:", err);
      setError("Failed to create announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PageTitle
        title="Add Announcement"
        subtitle="Create a new announcement for vendors"
        icon={FiPlus}
        className="mb-4"
      />

      <div className="card announcement-form-card">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Title */}
              <div className="col-12">
                <label className="form-label fw-bold">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              {/* Category */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Category *</label>
                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="policy_changes">Policy Changes</option>
                  <option value="new_features">New Features</option>
                  <option value="events">Events</option>
                  <option value="holidays">Holidays</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Priority */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Priority *</label>
                <select
                  className="form-select"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Publish Date */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Publish Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Expiry Date */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>

              {/* Content */}
              <div className="col-12">
                <label className="form-label fw-bold">Content *</label>
                <textarea
                  className="form-control"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Enter announcement content"
                  required
                />
              </div>

              {/* Pin Announcement */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isPinned"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isPinned">
                    Pin this announcement (will appear at the top)
                  </label>
                </div>
              </div>

              {/* Attachments */}
              <div className="col-12">
                <label className="form-label fw-bold">Attachments (Optional)</label>
                <div className="upload-area">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="attachments" className="upload-label">
                    <FiUpload className="me-2" />
                    Click to upload files (PDF, Word, Excel, Images)
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="attachments-list mt-3">
                    {attachments.map((file, index) => (
                      <div key={index} className="attachment-item">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-warning px-4 py-2 rounded-pill"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <FiSave className="me-2" />
                      Create Announcement
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
