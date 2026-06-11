import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiMessageSquare, FiSearch, FiFilter, FiThumbsUp, FiMessageCircle, FiShare2, FiBookmark, FiMoreHorizontal } from "react-icons/fi";
import api from "../../api/client";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/WomenVendorCommunityPage.css";

export default function WomenVendorCommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");

  useEffect(() => {
    loadPosts();
  }, [categoryFilter]);

  const loadPosts = async () => {
    try {
      const params = categoryFilter !== "all" ? { category: categoryFilter } : {};
      const res = await api.get("/women-support/community/posts", { params });
      setPosts(res.data.posts || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading community posts:", err);
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      await api.post("/women-support/community/posts", {
        content: newPostContent,
        category: newPostCategory,
      });
      setNewPostContent("");
      setShowNewPostModal(false);
      loadPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create post");
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await api.post(`/women-support/community/posts/${postId}/like`);
      loadPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <VendorLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/vendor/women-support")}
            >
              ← Back
            </button>
            <div>
              <h2 className="fw-bold mb-1">Women Vendor Community</h2>
              <p className="text-muted mb-0">Connect, share, and grow with fellow women entrepreneurs</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewPostModal(true)}
          >
            <FiMessageSquare className="me-2" />
            Create Post
          </button>
        </div>

        {/* Search and Filter */}
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <FiSearch className="text-muted me-2" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search posts, topics, or members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <FiFilter className="text-muted me-2" />
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General Discussion</option>
                    <option value="business">Business Tips</option>
                    <option value="support">Support & Help</option>
                    <option value="success">Success Stories</option>
                    <option value="events">Events & Meetups</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-primary text-white">
              <div className="card-body text-center">
                <FiUsers className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">1,247</h3>
                <small className="opacity-75">Active Members</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-success text-white">
              <div className="card-body text-center">
                <FiMessageSquare className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">{posts.length}</h3>
                <small className="opacity-75">Community Posts</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-info text-white">
              <div className="card-body text-center">
                <FiThumbsUp className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">892</h3>
                <small className="opacity-75">Helpful Responses</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-warning text-white">
              <div className="card-body text-center">
                <FiBookmark className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">156</h3>
                <small className="opacity-75">Saved Resources</small>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="row">
          <div className="col-lg-8">
            {filteredPosts.length === 0 ? (
              <div className="card shadow-sm border-0">
                <div className="card-body text-center py-5">
                  <FiUsers className="text-muted mb-3" style={{ fontSize: "3rem" }} />
                  <h5 className="text-muted">No posts found</h5>
                  <p className="text-muted">Be the first to share something with the community!</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowNewPostModal(true)}
                  >
                    Create First Post
                  </button>
                </div>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div className="card shadow-sm mb-3 border-0" key={post.id}>
                  <div className="card-body">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: "36px", height: "36px", fontSize: "1rem", fontWeight: "700", lineHeight: "1", borderRadius: "50%" }}>
                        {post.author_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-0">{post.author_name || "Anonymous"}</h6>
                            <small className="text-muted">
                              {post.business_category || "Women Vendor"} • {new Date(post.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <button className="btn btn-link text-muted p-0">
                            <FiMoreHorizontal />
                          </button>
                        </div>
                        <div className="mt-2">
                          <span className="badge bg-secondary mb-2">{post.category || "General"}</span>
                          <p className="mb-2">{post.content}</p>
                        </div>
                        <div className="d-flex align-items-center gap-3 mt-3">
                          <button
                            className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                            onClick={() => handleLikePost(post.id)}
                          >
                            <FiThumbsUp />
                            <small>{post.likes_count || 0}</small>
                          </button>
                          <button className="btn btn-link text-muted p-0 d-flex align-items-center gap-1">
                            <FiMessageCircle />
                            <small>{post.comments_count || 0}</small>
                          </button>
                          <button className="btn btn-link text-muted p-0 d-flex align-items-center gap-1">
                            <FiShare2 />
                          </button>
                          <button className="btn btn-link text-muted p-0 d-flex align-items-center gap-1">
                            <FiBookmark />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card shadow-sm mb-3 border-0">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Community Guidelines</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">✓ Be respectful and supportive</li>
                  <li className="mb-2">✓ Share helpful business tips</li>
                  <li className="mb-2">✓ Celebrate each other's success</li>
                  <li className="mb-2">✓ Ask questions and offer help</li>
                  <li className="mb-0">✓ Keep discussions professional</li>
                </ul>
              </div>
            </div>

            <div className="card shadow-sm mb-3 border-0">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Popular Topics</h6>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-light text-dark">#BusinessTips</span>
                  <span className="badge bg-light text-dark">#SuccessStories</span>
                  <span className="badge bg-light text-dark">#Networking</span>
                  <span className="badge bg-light text-dark">#Support</span>
                  <span className="badge bg-light text-dark">#Events</span>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Active Members</h6>
                <div className="d-flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                      style={{ width: "36px", height: "36px", fontSize: "0.9rem", fontWeight: "600", lineHeight: "1" }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px", fontSize: "0.8rem", fontWeight: "600", lineHeight: "1" }}>
                    +1241
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Post Modal */}
        {showNewPostModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Post</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowNewPostModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Category</label>
                    <select
                      className="form-select"
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                    >
                      <option value="general">General Discussion</option>
                      <option value="business">Business Tips</option>
                      <option value="support">Support & Help</option>
                      <option value="success">Success Stories</option>
                      <option value="events">Events & Meetups</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Your Post</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your thoughts, questions, or success stories with the community..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewPostModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
