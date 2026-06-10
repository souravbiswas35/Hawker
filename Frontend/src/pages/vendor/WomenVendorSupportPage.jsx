import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPhone, FiShield, FiUsers, FiAward, FiBookOpen, FiAlertTriangle, FiDownload, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import api from "../../api/client";
import "../../styles/pages/vendor/WomenVendorSupportPage.css";

export default function WomenVendorSupportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(null);
  const [accessMessage, setAccessMessage] = useState("");
  const [supportData, setSupportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const res = await api.get("/vendor/women-support/access");
      setCanAccess(res.data.canAccess);
      setAccessMessage(res.data.message);

      if (res.data.canAccess) {
        await loadSupportData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to check access. Please try again.");
      setLoading(false);
    }
  };

  const loadSupportData = async () => {
    try {
      const res = await api.get("/vendor/women-support/data");
      setSupportData(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load support data. Please try again.");
      setLoading(false);
    }
  };

  const handleApplyScheme = async (schemeId) => {
    navigate(`/vendor/women-support/schemes/${schemeId}`);
  };

  const handleConnectMentor = async (mentorId) => {
    try {
      await api.post(`/vendor/women-support/mentors/${mentorId}/connect`);
      alert("Mentor connection request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to connect with mentor. Please try again.");
    }
  };

  const handleEmergencyCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, "_self");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-5">
                <FiShield className="text-warning mb-3" style={{ fontSize: "4rem" }} />
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
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "var(--hawker-ink)" }}>
            Women Vendor Support
          </h2>
          <p className="text-muted mb-0">Special features and support for women entrepreneurs</p>
        </div>
        <span className="badge bg-success fs-6">Special Feature</span>
      </div>

      {/* Emergency SOS Section */}
      <div className="card shadow-sm mb-4 border-0" style={{ borderLeft: "4px solid #dc3545" }}>
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <FiAlertTriangle className="text-danger me-2" style={{ fontSize: "1.5rem" }} />
            <h5 className="card-title mb-0 text-danger">Emergency SOS</h5>
          </div>
          <p className="text-muted mb-3">24/7 Women Safety Helpline - Immediate assistance available</p>
          <div className="row g-2">
            {supportData?.emergencyContacts?.map((contact) => (
              <div className="col-md-4" key={contact.id}>
                <div className="d-grid">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleEmergencyCall(contact.phone_number)}
                  >
                    <FiPhone className="me-1" />
                    {contact.contact_name}
                    {contact.available_24_7 && <span className="badge bg-danger ms-2">24/7</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schemes & Subsidies Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <FiAward className="text-primary me-2" style={{ fontSize: "1.5rem" }} />
            <h5 className="card-title mb-0">Schemes & Subsidies</h5>
          </div>
          <div className="row g-3">
            {supportData?.schemes?.map((scheme) => (
              <div className="col-md-4" key={scheme.id}>
                <div className="card h-100 border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title fw-bold mb-2">{scheme.name}</h6>
                    <p className="card-text text-muted small mb-2">{scheme.description}</p>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-success fs-6">
                        {scheme.amount > 0 ? `৳ ${scheme.amount.toLocaleString()}` : "Free"}
                      </span>
                      {scheme.deadline && (
                        <small className="text-muted">
                          Deadline: {new Date(scheme.deadline).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => handleApplyScheme(scheme.id)}
                    >
                      View Details & Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mentorship Program Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <FiUsers className="text-primary me-2" style={{ fontSize: "1.5rem" }} />
              <h5 className="card-title mb-0">Mentorship Program</h5>
            </div>
            <span className="badge bg-info">{supportData?.mentors?.length || 0} Available</span>
          </div>
          <div className="row g-3">
            {supportData?.mentors?.slice(0, 3).map((mentor) => (
              <div className="col-md-4" key={mentor.id}>
                <div className="card h-100 border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "40px", height: "40px" }}>
                        {mentor.name.charAt(0)}
                      </div>
                      <div>
                        <h6 className="card-title fw-bold mb-0">{mentor.name}</h6>
                        <small className="text-muted">{mentor.expertise}</small>
                      </div>
                    </div>
                    <p className="card-text text-muted small mb-2">
                      {mentor.experience_years} years experience
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => handleConnectMentor(mentor.id)}
                    >
                      Connect With Mentor
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {supportData?.mentors?.length > 3 && (
            <div className="text-center mt-3">
              <button className="btn btn-link text-primary">
                View All Mentors ({supportData.mentors.length} Available) <FiArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <FiBookOpen className="text-primary me-2" style={{ fontSize: "1.5rem" }} />
            <h5 className="card-title mb-0">Success Stories</h5>
          </div>
          <div className="row g-3">
            {supportData?.successStories?.slice(0, 3).map((story) => (
              <div className="col-md-4" key={story.id}>
                <div className="card h-100 border-0 bg-light">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-2" style={{ width: "40px", height: "40px" }}>
                        {story.vendor_name.charAt(0)}
                      </div>
                      <div>
                        <h6 className="card-title fw-bold mb-0">{story.vendor_name}</h6>
                        <small className="text-muted">{story.business_category}</small>
                      </div>
                    </div>
                    <p className="card-text text-muted small mb-2">
                      <strong>Earnings:</strong> {story.earnings_monthly}
                    </p>
                    <p className="card-text small mb-2">{story.story_title}</p>
                    <button className="btn btn-link text-primary btn-sm p-0">
                      Read Story <FiArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Women Vendor Community Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <FiUsers className="text-primary me-2" style={{ fontSize: "1.5rem" }} />
            <h5 className="card-title mb-0">Women Vendor Community</h5>
          </div>
          <p className="text-muted mb-3">
            Connect with {supportData?.communityCount || 1247} women vendors across the city
          </p>
          <button className="btn btn-primary">
            Join Community Forum <FiArrowRight className="ms-1" />
          </button>
        </div>
      </div>

      {/* Safety Guidelines Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <FiShield className="text-primary me-2" style={{ fontSize: "1.5rem" }} />
            <h5 className="card-title mb-0">Safety Guidelines</h5>
          </div>
          <p className="text-muted mb-3">Essential safety tips for women vendors</p>
          <div className="row g-2">
            {supportData?.safetyGuides?.map((guide) => (
              <div className="col-md-6" key={guide.id}>
                <div className="d-flex align-items-center p-3 bg-light rounded">
                  <FiCheckCircle className="text-success me-2" />
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{guide.title}</h6>
                    <small className="text-muted">{guide.description}</small>
                  </div>
                  <button className="btn btn-outline-primary btn-sm">
                    <FiDownload className="me-1" />
                    Download Guide
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
