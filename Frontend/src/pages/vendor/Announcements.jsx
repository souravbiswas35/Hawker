import { useState, useEffect } from "react";
import { FiBell, FiFilter, FiSearch, FiDownload, FiEye, FiArchive, FiCalendar, FiTag, FiBookmark } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/Announcements.css";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, [filterCategory]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = { status: 'active' };
      if (filterCategory) params.category = filterCategory;

      const { data } = await api.get("/announcements", { params });
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnnouncement = async (announcementId) => {
    try {
      const { data } = await api.get(`/announcements/${announcementId}`);
      setSelectedAnnouncement(data.announcement);
      setShowModal(true);
      
      // Refresh to update view count
      fetchAnnouncements();
    } catch (err) {
      console.error("Failed to fetch announcement details:", err);
      setError("Failed to load announcement details");
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await api.get(`/uploads/${attachment.filePath}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download attachment:", err);
      alert("Failed to download attachment");
    }
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      policy_changes: { class: "bg-primary", label: "Policy Changes" },
      new_features: { class: "bg-success", label: "New Features" },
      events: { class: "bg-info", label: "Events" },
      holidays: { class: "bg-warning", label: "Holidays" },
      general: { class: "bg-secondary", label: "General" }
    };
    const config = categoryConfig[category] || categoryConfig.general;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { class: "bg-secondary", label: "Low" },
      medium: { class: "bg-info", label: "Medium" },
      high: { class: "bg-warning", label: "High" },
      urgent: { class: "bg-danger", label: "Urgent" }
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        announcement.title?.toLowerCase().includes(query) ||
        announcement.content?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <VendorLayout>
      <PageTitle
        title="Announcements"
        subtitle="Stay updated with the latest news and updates"
        icon={FiBell}
        className="mb-4"
      />

      {/* Filters and Search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="policy_changes">Policy Changes</option>
                <option value="new_features">New Features</option>
                <option value="events">Events</option>
                <option value="holidays">Holidays</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Search</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FiSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="row">
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-warning" role="status" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="col-12 text-center py-5">
            <FiBell size={48} className="text-muted mb-3" />
            <h6>No announcements found</h6>
            <p className="text-muted">There are no announcements matching your criteria.</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="col-12 mb-3">
              <div className={`card announcement-card ${announcement.isPinned ? 'pinned' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      {announcement.isPinned && <FiBookmark className="text-warning" />}
                      <h5 className="mb-0">{announcement.title}</h5>
                    </div>
                    <div className="d-flex gap-2">
                      {getCategoryBadge(announcement.category)}
                      {getPriorityBadge(announcement.priority)}
                    </div>
                  </div>
                  
                  <p className="announcement-preview mb-2">
                    {announcement.content.substring(0, 200)}
                    {announcement.content.length > 200 && "..."}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-3 text-muted small">
                      <span>
                        <FiCalendar className="me-1" />
                        {new Date(announcement.publishDate).toLocaleDateString()}
                      </span>
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <span>
                          <FiDownload className="me-1" />
                          {announcement.attachments.length} attachment(s)
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleViewAnnouncement(announcement.id)}
                    >
                      <FiEye className="me-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div className="modal announcement-modal show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center gap-2">
                  {selectedAnnouncement.isPinned && <FiBookmark className="text-warning" />}
                  <h5 className="modal-title">{selectedAnnouncement.title}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="d-flex gap-2 mb-3">
                  {getCategoryBadge(selectedAnnouncement.category)}
                  {getPriorityBadge(selectedAnnouncement.priority)}
                </div>

                <div className="mb-3">
                  <strong>Posted:</strong>{' '}
                  {new Date(selectedAnnouncement.publishDate).toLocaleString()}
                </div>

                {selectedAnnouncement.expiryDate && (
                  <div className="mb-3">
                    <strong>Expires:</strong>{' '}
                    {new Date(selectedAnnouncement.expiryDate).toLocaleString()}
                  </div>
                )}

                <div className="mb-4">
                  <strong>Content:</strong>
                  <div className="mt-2 announcement-content">
                    {selectedAnnouncement.content}
                  </div>
                </div>

                {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                  <div className="mb-3">
                    <strong>Attachments:</strong>
                    <div className="mt-2">
                      {selectedAnnouncement.attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <FiDownload className="me-2" />
                            {attachment.fileName}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop show" onClick={() => setShowModal(false)} />
      )}
    </VendorLayout>
  );
}
