import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiMessageSquare, FiSearch, FiFilter, FiThumbsUp, FiMessageCircle, FiShare2, FiBookmark, FiMoreHorizontal, FiHeart, FiCopy, FiShield, FiSave } from "react-icons/fi";
import { FaFacebook, FaWhatsapp, FaTwitter, FaLink } from "react-icons/fa";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/WomenVendorCommunityPage.css";

export default function WomenVendorCommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(null);
  const [accessMessage, setAccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");
  const [stats, setStats] = useState({
    activeMembers: 0,
    totalPosts: 0,
    helpfulResponses: 0,
    savedResources: 0
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [showShareModal, setShowShareModal] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [showPostMenu, setShowPostMenu] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const res = await api.get("/vendor/women-support/access");
      setCanAccess(res.data.canAccess);
      setAccessMessage(res.data.message);

      if (res.data.canAccess) {
        loadPosts();
        loadStats();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadPosts();
      loadStats();
    }
  }, [categoryFilter, canAccess]);

  const loadPosts = async () => {
    try {
      const params = categoryFilter !== "all" ? { category: categoryFilter } : {};
      const res = await api.get("/women-support/community/posts", { params });
      setPosts(res.data.posts || []);
      setLoading(false);
      
      // Load like and save status for each post
      res.data.posts?.forEach(async (post) => {
        try {
          const [likeRes, saveRes] = await Promise.all([
            api.get(`/women-support/community/posts/${post.id}/liked`),
            api.get(`/women-support/community/posts/${post.id}/saved`)
          ]);
          
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (likeRes.data.liked) newSet.add(post.id);
            else newSet.delete(post.id);
            return newSet;
          });
          
          setSavedPosts(prev => {
            const newSet = new Set(prev);
            if (saveRes.data.saved) newSet.add(post.id);
            else newSet.delete(post.id);
            return newSet;
          });
        } catch (err) {
          console.error("Error loading like/save status:", err);
        }
      });
    } catch (err) {
      console.error("Error loading community posts:", err);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/women-support/community/stats");
      console.log("Stats response:", res.data);
      console.log("activeMembers type:", typeof res.data.activeMembers);
      console.log("activeMembers value:", res.data.activeMembers);
      
      const activeMembers = parseInt(res.data.activeMembers) || 0;
      const totalPosts = parseInt(res.data.totalPosts) || 0;
      const helpfulResponses = parseInt(res.data.helpfulResponses) || 0;
      const savedResources = parseInt(res.data.savedResources) || 0;
      
      console.log("Parsed stats:", { activeMembers, totalPosts, helpfulResponses, savedResources });
      
      setStats({
        activeMembers,
        totalPosts,
        helpfulResponses,
        savedResources
      });
      setStatsLoading(false);
    } catch (err) {
      console.error("Error loading community stats:", err);
      setStatsLoading(false);
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
      const res = await api.post(`/women-support/community/posts/${postId}/like`);
      
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (res.data.liked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + (res.data.liked ? 1 : -1) }
          : post
      ));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const res = await api.post(`/women-support/community/posts/${postId}/save`);

      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (res.data.saved) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });

      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, saves_count: post.saves_count + (res.data.saved ? 1 : -1) }
          : post
      ));
    } catch (err) {
      console.error("Error saving post:", err);
    }
  };

  const handleSharePost = async (postId, platform) => {
    try {
      await api.post(`/women-support/community/posts/${postId}/share`, { platform });
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, shares_count: post.shares_count + 1 }
          : post
      ));
      
      // Actually share the link
      const shareUrl = `${window.location.origin}/vendor/women-support/community`;
      if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank');
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
      
      setShowShareModal(null);
    } catch (err) {
      console.error("Error sharing post:", err);
    }
  };

  const handleToggleComments = async (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    if (!showComments[postId]) {
      try {
        const res = await api.get(`/women-support/community/posts/${postId}/comments`);
        setComments(prev => ({
          ...prev,
          [postId]: res.data.comments || []
        }));
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const content = newComments[postId];
    if (!content || !content.trim()) return;
    
    try {
      await api.post(`/women-support/community/posts/${postId}/comments`, { content });
      
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      
      // Reload comments
      const res = await api.get(`/women-support/community/posts/${postId}/comments`);
      setComments(prev => ({
        ...prev,
        [postId]: res.data.comments || []
      }));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (err) {
      console.error("Error adding comment:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await api.delete(`/women-support/community/comments/${commentId}`);
      
      // Reload comments
      const res = await api.get(`/women-support/community/posts/${postId}/comments`);
      setComments(prev => ({
        ...prev,
        [postId]: res.data.comments || []
      }));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
          : post
      ));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentContent('');
  };

  const handleSaveEdit = async (commentId, postId) => {
    if (!editCommentContent.trim()) return;
    
    try {
      await api.put(`/women-support/community/comments/${commentId}`, { content: editCommentContent });
      
      setEditingComment(null);
      setEditCommentContent('');
      
      // Reload comments
      const res = await api.get(`/women-support/community/posts/${postId}/comments`);
      setComments(prev => ({
        ...prev,
        [postId]: res.data.comments || []
      }));
    } catch (err) {
      console.error("Error editing comment:", err);
      alert(err.response?.data?.message || "Failed to edit comment");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/women-support/community/posts/${postId}`);
      
      // Reload posts
      loadPosts();
      setShowPostMenu(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.business_category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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

  if (!canAccess) {
    return (
      <VendorLayout>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center py-5">
                  <div className="d-flex justify-content-center mb-3">
                    <FiShield className="text-warning" style={{ fontSize: "4rem" }} />
                  </div>
                  <h3 className="card-title mb-3">Access Restricted</h3>
                  <p className="card-text text-muted fs-5">{accessMessage}</p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => navigate("/vendor/dashboard")}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <PageTitle
        title="Women Vendor Community"
        subtitle="Connect, share, and grow with fellow women entrepreneurs"
        icon={FiHeart}
        iconSize={62}
        className="mb-4"
      />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/vendor/women-support")}
          >
            ← Back to Support
          </button>
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
                <h3 className="fw-bold mb-0">{typeof stats.activeMembers === 'number' ? stats.activeMembers.toLocaleString() : '0'}</h3>
                <small className="opacity-75">Active Members</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-success text-white">
              <div className="card-body text-center">
                <FiMessageSquare className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">{typeof stats.totalPosts === 'number' ? stats.totalPosts.toLocaleString() : '0'}</h3>
                <small className="opacity-75">Community Posts</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-info text-white">
              <div className="card-body text-center">
                <FiMessageCircle className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">{typeof stats.helpfulResponses === 'number' ? stats.helpfulResponses.toLocaleString() : '0'}</h3>
                <small className="opacity-75">Helpful Responses</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 bg-warning text-white">
              <div className="card-body text-center">
                <FiSave className="mb-2" style={{ fontSize: "2rem" }} />
                <h3 className="fw-bold mb-0">{typeof stats.savedResources === 'number' ? stats.savedResources.toLocaleString() : '0'}</h3>
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
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px", fontSize: "1.1rem", fontWeight: "700", lineHeight: "1", borderRadius: "50%" }}>
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
                          <div className="position-relative">
                            <button 
                              className="btn btn-link text-muted p-0"
                              onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                            >
                              <FiMoreHorizontal />
                            </button>
                            {showPostMenu === post.id && (
                              <div className="position-absolute end-0 top-100 mt-1 bg-white shadow-sm border rounded" style={{ zIndex: 1000 }}>
                                <button
                                  className="btn btn-link text-danger w-100 text-start p-2"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  Delete Post
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="badge bg-secondary mb-2">{post.category || "General"}</span>
                          <p className="mb-2">{post.content}</p>
                        </div>
                        <div className="d-flex align-items-center gap-3 mt-3">
                          <button
                            className={`btn btn-link p-0 d-flex align-items-center gap-1 ${likedPosts.has(post.id) ? 'text-primary' : 'text-muted'}`}
                            onClick={() => handleLikePost(post.id)}
                          >
                            <FiThumbsUp />
                            <small>{post.likes_count || 0}</small>
                          </button>
                          <button
                            className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                            onClick={() => handleToggleComments(post.id)}
                          >
                            <FiMessageCircle />
                            <small>{post.comments_count || 0}</small>
                          </button>
                          <button
                            className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                            onClick={() => setShowShareModal(post.id)}
                          >
                            <FiShare2 />
                            <small>{post.shares_count || 0}</small>
                          </button>
                          <button
                            className={`btn btn-link p-0 d-flex align-items-center gap-1 ${savedPosts.has(post.id) ? 'text-warning' : 'text-muted'}`}
                            onClick={() => handleSavePost(post.id)}
                          >
                            <FiBookmark />
                            <small>{post.saves_count || 0}</small>
                          </button>
                        </div>
                        
                        {/* Comments Section */}
                        {showComments[post.id] && (
                          <div className="mt-3 pt-3 border-top">
                            <div className="mb-3">
                              {comments[post.id]?.map((comment) => (
                                <div key={comment.id} className="mb-2 p-2 bg-light rounded">
                                  {editingComment === comment.id ? (
                                    <div className="d-flex gap-2">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={editCommentContent}
                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(comment.id, post.id)}
                                      />
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleSaveEdit(comment.id, post.id)}
                                      >
                                        Save
                                      </button>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleCancelEdit}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <strong className="small">{comment.author_name}</strong>
                                        <p className="mb-0 small text-muted">{comment.content}</p>
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </small>
                                        <button
                                          className="btn btn-link p-0 text-muted"
                                          style={{ fontSize: "0.8rem" }}
                                          onClick={() => handleEditComment(comment)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="btn btn-link p-0 text-danger"
                                          style={{ fontSize: "0.8rem" }}
                                          onClick={() => handleDeleteComment(comment.id, post.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(!comments[post.id] || comments[post.id].length === 0) && (
                                <p className="text-muted small mb-0">No comments yet. Be the first to comment!</p>
                              )}
                            </div>
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Write a comment..."
                                value={newComments[post.id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddComment(post.id)}
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        )}
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

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content share-modal">
                <div className="modal-header">
                  <h5 className="modal-title">Share Post</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowShareModal(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSharePost(showShareModal, 'facebook')}
                    >
                      <FaFacebook size={20} />
                      Share on Facebook
                    </button>
                    <button
                      className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSharePost(showShareModal, 'whatsapp')}
                    >
                      <FaWhatsapp size={20} />
                      Share on WhatsApp
                    </button>
                    <button
                      className="btn btn-outline-info d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSharePost(showShareModal, 'twitter')}
                    >
                      <FaTwitter size={20} />
                      Share on Twitter
                    </button>
                    <button
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleSharePost(showShareModal, 'copy')}
                    >
                      <FaLink size={20} />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
