import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import api from "../../api/client";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    content: "",
    category: "general",
    is_approved: true,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await api.get("/women-support/admin/community/posts");
      setPosts(res.data.posts || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading posts:", err);
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      category: post.category,
      is_approved: post.is_approved === 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/women-support/admin/community/posts/${id}`);
      loadPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/women-support/admin/community/posts/${editingPost.id}`, {
        ...formData,
        is_approved: formData.is_approved ? 1 : 0,
      });
      setShowModal(false);
      loadPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post");
    }
  };

  const toggleApproval = async (id, currentStatus) => {
    try {
      const post = posts.find(p => p.id === id);
      await api.put(`/women-support/admin/community/posts/${id}`, {
        content: post.content,
        category: post.category,
        is_approved: currentStatus === 1 ? 0 : 1,
      });
      loadPosts();
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
            <h2 className="fw-bold mb-1">Community Posts Management</h2>
            <p className="text-muted mb-0">Manage women vendor community posts</p>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Business</th>
                    <th>Content</th>
                    <th>Category</th>
                    <th>Likes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No community posts found
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id}>
                        <td>
                          <div className="fw-bold">{post.author_name}</div>
                        </td>
                        <td>{post.business_category}</td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: "200px" }}>
                            {post.content}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{post.category}</span>
                        </td>
                        <td>{post.likes_count}</td>
                        <td>
                          <span className={`badge ${post.is_approved === 1 ? "bg-success" : "bg-warning"}`}>
                            {post.is_approved === 1 ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(post)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => toggleApproval(post.id, post.is_approved)}
                              title={post.is_approved === 1 ? "Unapprove" : "Approve"}
                            >
                              {post.is_approved === 1 ? <FiX /> : <FiCheck />}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(post.id)}
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
                  <h5 className="modal-title">Edit Community Post</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Content *</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="general">General</option>
                        <option value="business">Business</option>
                        <option value="support">Support</option>
                        <option value="success">Success</option>
                        <option value="events">Events</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
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
                      Update
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
