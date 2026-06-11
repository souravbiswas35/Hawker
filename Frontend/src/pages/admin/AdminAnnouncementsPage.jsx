import { useState, useEffect } from "react";
import { FiBell, FiPlus, FiFilter, FiSearch, FiBookmark, FiEye, FiEdit, FiArchive, FiTrash2, FiCalendar, FiTag } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminAnnouncementsPage.css";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pinned: 0,
    byCategory: {}
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [filterCategory, filterStatus]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = { status: filterStatus };
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

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/announcements/stats");
      setStats(data.stats || { total: 0, pinned: 0, byCategory: {} });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleViewAnnouncement = async (announcementId) => {
    try {
      const { data } = await api.get(`/announcements/${announcementId}`);
      setSelectedAnnouncement(data.announcement);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch announcement details:", err);
      setError("Failed to load announcement details");
    }
  };

  const handleArchive = async (announcementId) => {
    if (!window.confirm("Are you sure you want to archive this announcement?")) {
      return;
    }

    try {
      await api.patch(`/announcements/${announcementId}/archive`);
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      console.error("Failed to archive announcement:", err);
      setError("Failed to archive announcement");
    }
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/announcements/${announcementId}`);
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setError("Failed to delete announcement");
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

  const getStatusBadge = (isActive, expiryDate) => {
    if (!isActive) return <span className="badge bg-secondary">Archived</span>;
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <span className="badge bg-danger">Expired</span>;
    }
    return <span className="badge bg-success">Active</span>;
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
    <AdminLayout>
      <PageTitle
        title="Announcement Management"
        subtitle="Create and manage announcements for vendors"
        icon={FiBell}
        className="mb-4"
      />

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card announcement-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="announcement-stat-icon bg-primary">
                  <FiBell size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Total Announcements</h6>
                  <h3 className="mb-0">{stats.total}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card announcement-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="announcement-stat-icon bg-warning">
                  <FiBookmark size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Pinned</h6>
                  <h3 className="mb-0">{stats.pinned}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card announcement-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="announcement-stat-icon bg-success">
                  <FiTag size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Categories</h6>
                  <h3 className="mb-0">{Object.keys(stats.byCategory).length}</h3>
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
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-6">
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

      {/* Add Announcement Button */}
      <div className="mb-4">
        <Link to="/admin/announcements/add" className="btn btn-warning px-4 py-2 rounded-pill">
          <FiPlus className="me-2" />
          Add Announcement
        </Link>
      </div>

      {/* Announcements List */}
      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status" />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-5">
              <FiBell size={48} className="text-muted mb-3" />
              <h6>No announcements found</h6>
              <p className="text-muted">There are no announcements matching your criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Publish Date</th>
                    <th>Views</th>
                    <th>Attachments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((announcement) => (
                    <tr key={announcement.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {announcement.isPinned && <FiBookmark className="text-warning" />}
                          <span className="fw-bold">{announcement.title}</span>
                        </div>
                      </td>
                      <td>{getCategoryBadge(announcement.category)}</td>
                      <td>{getPriorityBadge(announcement.priority)}</td>
                      <td>{getStatusBadge(announcement.isActive, announcement.expiryDate)}</td>
                      <td>
                        <small>{new Date(announcement.publishDate).toLocaleDateString()}</small>
                      </td>
                      <td>{announcement.viewCount || 0}</td>
                      <td>{announcement.attachments?.length || 0}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewAnnouncement(announcement.id)}
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleArchive(announcement.id)}
                            disabled={!announcement.isActive}
                          >
                            <FiArchive />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                  {getStatusBadge(selectedAnnouncement.isActive, selectedAnnouncement.expiryDate)}
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Posted:</strong>{' '}
                    {new Date(selectedAnnouncement.publishDate).toLocaleString()}
                  </div>
                  <div className="col-md-6">
                    <strong>Views:</strong>{' '}
                    {selectedAnnouncement.viewCount || 0}
                  </div>
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
                          <span>{attachment.fileName}</span>
                          <span className="text-muted ms-2">({(attachment.fileSize / 1024).toFixed(2)} KB)</span>
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
    </AdminLayout>
  );
}
