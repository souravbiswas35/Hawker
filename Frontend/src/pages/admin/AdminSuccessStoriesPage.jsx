import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiCheck, FiX } from "react-icons/fi";
import api from "../../api/client";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminSuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [formData, setFormData] = useState({
    vendor_name: "",
    business_category: "",
    earnings_monthly: "",
    story_title: "",
    full_story: "",
    business_journey: "",
    is_approved: true,
  });

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await api.get("/women-support/admin/success-stories");
      setStories(res.data.stories || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading stories:", err);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStory(null);
    setFormData({
      vendor_name: "",
      business_category: "",
      earnings_monthly: "",
      story_title: "",
      full_story: "",
      business_journey: "",
      is_approved: true,
    });
    setShowModal(true);
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setFormData({
      vendor_name: story.vendor_name,
      business_category: story.business_category,
      earnings_monthly: story.earnings_monthly,
      story_title: story.story_title,
      full_story: story.full_story,
      business_journey: story.business_journey,
      is_approved: story.is_approved === 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this success story?")) return;

    try {
      await api.delete(`/women-support/admin/success-stories/${id}`);
      loadStories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete story");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStory) {
        await api.put(`/women-support/admin/success-stories/${editingStory.id}`, {
          ...formData,
          is_approved: formData.is_approved ? 1 : 0,
        });
      } else {
        await api.post("/women-support/admin/success-stories", {
          ...formData,
          is_approved: formData.is_approved ? 1 : 0,
        });
      }
      setShowModal(false);
      loadStories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save story");
    }
  };

  const toggleApproval = async (id, currentStatus) => {
    try {
      const story = stories.find(s => s.id === id);
      await api.put(`/women-support/admin/success-stories/${id}`, {
        vendor_name: story.vendor_name,
        business_category: story.business_category,
        earnings_monthly: story.earnings_monthly,
        story_title: story.story_title,
        full_story: story.full_story,
        business_journey: story.business_journey,
        is_approved: currentStatus === 1 ? 0 : 1,
      });
      loadStories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update approval status");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Success Stories Management</h2>
            <p className="text-muted mb-0">Manage women vendor success stories</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus className="me-2" />
            Add Story
          </button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Business</th>
                    <th>Earnings</th>
                    <th>Story Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        No success stories found
                      </td>
                    </tr>
                  ) : (
                    stories.map((story) => (
                      <tr key={story.id}>
                        <td>
                          <div className="fw-bold">{story.vendor_name}</div>
                        </td>
                        <td>{story.business_category}</td>
                        <td>{story.earnings_monthly}</td>
                        <td>{story.story_title}</td>
                        <td>
                          <span className={`badge ${story.is_approved === 1 ? "bg-success" : "bg-warning"}`}>
                            {story.is_approved === 1 ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(story)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => toggleApproval(story.id, story.is_approved)}
                              title={story.is_approved === 1 ? "Unapprove" : "Approve"}
                            >
                              {story.is_approved === 1 ? <FiX /> : <FiCheck />}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(story.id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingStory ? "Edit Success Story" : "Add Success Story"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Vendor Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.vendor_name}
                          onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Business Category *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.business_category}
                          onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Monthly Earnings *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.earnings_monthly}
                          onChange={(e) => setFormData({ ...formData, earnings_monthly: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <div className="form-check mt-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isApproved"
                            checked={formData.is_approved}
                            onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                          />
                          <label className="form-check-label" htmlFor="isApproved">
                            Approved
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Story Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.story_title}
                          onChange={(e) => setFormData({ ...formData, story_title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Full Story *</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.full_story}
                          onChange={(e) => setFormData({ ...formData, full_story: e.target.value })}
                          required
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Business Journey *</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.business_journey}
                          onChange={(e) => setFormData({ ...formData, business_journey: e.target.value })}
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingStory ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
