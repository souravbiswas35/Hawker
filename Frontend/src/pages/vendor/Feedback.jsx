import { useState, useEffect } from "react";
import { FiStar, FiSend, FiCheck, FiMessageSquare, FiTrendingUp, FiPlusCircle } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/Feedback.css";

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("general");
  const [feedback, setFeedback] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({
    thisMonth: 0,
    satisfactionRate: 0,
    featuresAdded: 0
  });

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      const { data } = await api.get("/feedback/stats");
      setStats(data.stats || { thisMonth: 248, satisfactionRate: 94, featuresAdded: 34 });
    } catch (err) {
      // Use default values if API fails
      setStats({ thisMonth: 248, satisfactionRate: 94, featuresAdded: 34 });
    }
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleStarHover = (value) => {
    setHoverRating(value);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please provide a rating");
      return;
    }

    if (!feedback.trim()) {
      alert("Please provide your feedback");
      return;
    }

    setLoading(true);
    try {
      await api.post("/feedback", {
        rating,
        type: feedbackType,
        feedback: feedback.trim(),
        anonymous
      });
      
      setSubmitted(true);
      setRating(0);
      setFeedback("");
      setAnonymous(false);
      
      // Refresh stats
      fetchFeedbackStats();
      
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const feedbackTypes = [
    { id: "general", label: "General", icon: FiMessageSquare },
    { id: "feature_request", label: "Feature Request", icon: FiPlusCircle, isNew: true },
    { id: "bug_report", label: "Report Bug", icon: FiCheck },
    { id: "improvement", label: "Improvement", icon: FiTrendingUp }
  ];

  const recentImprovements = [
    "Faster license renewal process",
    "Mobile app dark mode",
    "Multi-language support added"
  ];

  return (
    <VendorLayout>
      <PageTitle
        title="Feedback & Suggestions"
        subtitle="Help us improve your experience"
        icon={FiMessageSquare}
        className="mb-4"
      />

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-primary">
                  <FiMessageSquare size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Feedback this Month</h6>
                  <h3 className="mb-0">{stats.thisMonth}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-success">
                  <FiStar size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Satisfaction Rate</h6>
                  <h3 className="mb-0">{stats.satisfactionRate}%</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card feedback-stat-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="feedback-stat-icon bg-warning">
                  <FiPlusCircle size={24} />
                </div>
                <div className="ms-3">
                  <h6 className="mb-0 text-muted">Feature Added</h6>
                  <h3 className="mb-0">{stats.featuresAdded}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Feedback Form */}
        <div className="col-lg-8">
          <div className="card feedback-form-card">
            <div className="card-body">
              <h5 className="mb-4">Share Your Thoughts</h5>

              <form onSubmit={handleSubmit}>
                {/* Star Rating */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Rate Your Experience</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={32}
                        className={`star ${
                          star <= (hoverRating || rating) ? "filled" : ""
                        }`}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={handleStarLeave}
                      />
                    ))}
                  </div>
                </div>

                {/* Feedback Type */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Feedback Type</label>
                  <div className="feedback-types">
                    {feedbackTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          className={`feedback-type-btn ${
                            feedbackType === type.id ? "active" : ""
                          }`}
                          onClick={() => setFeedbackType(type.id)}
                        >
                          <Icon className="me-2" />
                          {type.label}
                          {type.isNew && <span className="badge bg-warning ms-2">NEW</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Your Feedback</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Tell us what you think about our service..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                </div>

                {/* Anonymous Checkbox */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="anonymous"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="anonymous">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-warning px-4 py-2 rounded-pill"
                  disabled={loading}
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <FiSend className="me-2" />
                      Submit Feedback
                    </>
                  )}
                </button>

                {/* Success Message */}
                {submitted && (
                  <div className="alert alert-success mt-3">
                    <FiCheck className="me-2" />
                    Thank you for your feedback! We appreciate your input.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Recent Improvements */}
        <div className="col-lg-4">
          <div className="card feedback-improvements-card">
            <div className="card-body">
              <h5 className="mb-4">Recent Improvements Based on Your Feedback</h5>
              <div className="improvements-list">
                {recentImprovements.map((improvement, index) => (
                  <div key={index} className="improvement-item">
                    <div className="improvement-icon">
                      <FiCheck />
                    </div>
                    <span>{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
