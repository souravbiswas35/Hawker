import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import api from "../../api/client";

export default function SchemeDetailPage() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    business_description: "",
    current_income: "",
    business_years: "",
    employees_count: "",
    funding_purpose: "",
    additional_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSchemeDetails();
  }, [schemeId]);

  const loadSchemeDetails = async () => {
    try {
      const res = await api.get("/vendor/women-support/data");
      const schemeData = res.data.schemes.find((s) => s.id === parseInt(schemeId));
      setScheme(schemeData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading scheme details:", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.post(`/vendor/women-support/schemes/${schemeId}/apply`, formData);
      setSuccessMessage("Scheme application submitted successfully!");
      setShowForm(false);
      setFormData({
        business_description: "",
        current_income: "",
        business_years: "",
        employees_count: "",
        funding_purpose: "",
        additional_notes: "",
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  if (!scheme) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          Scheme not found
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/vendor/women-support")}>
          <FiArrowLeft className="me-2" />
          Back to Women Support
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button
        className="btn btn-outline-secondary mb-4"
        onClick={() => navigate("/vendor/women-support")}
      >
        <FiArrowLeft className="me-2" />
        Back to Women Support
      </button>

      {successMessage && (
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <FiCheckCircle className="me-2" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <FiAlertCircle className="me-2" />
          {errorMessage}
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="fw-bold mb-2">{scheme.name}</h2>
              <p className="text-muted mb-0">{scheme.description}</p>
            </div>
            <div className="text-end">
              <div className="badge bg-success fs-5 mb-2">
                {scheme.amount > 0 ? `৳ ${scheme.amount.toLocaleString()}` : "Free"}
              </div>
              {scheme.deadline && (
                <small className="text-muted d-block">
                  Deadline: {new Date(scheme.deadline).toLocaleDateString()}
                </small>
              )}
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="col-md-6">
              <h5 className="fw-bold mb-3">Eligibility Criteria</h5>
              <p className="text-muted">{scheme.eligibility_criteria || "No specific eligibility criteria mentioned."}</p>
            </div>
            <div className="col-md-6">
              <h5 className="fw-bold mb-3">Scheme Status</h5>
              <span className={`badge ${scheme.status === "active" ? "bg-success" : "bg-secondary"}`}>
                {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
              </span>
            </div>
          </div>

          {!showForm ? (
            <div className="mt-4">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowForm(true)}
              >
                Apply Now
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <h4 className="fw-bold mb-3">Application Form</h4>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Business Description *</label>
                    <textarea
                      className="form-control"
                      name="business_description"
                      rows="3"
                      value={formData.business_description}
                      onChange={handleInputChange}
                      required
                      placeholder="Describe your business in detail..."
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Current Monthly Income (৳) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="current_income"
                      value={formData.current_income}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your current monthly income"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Years in Business *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="business_years"
                      value={formData.business_years}
                      onChange={handleInputChange}
                      required
                      min="0"
                      placeholder="How many years have you been in business?"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Number of Employees</label>
                    <input
                      type="number"
                      className="form-control"
                      name="employees_count"
                      value={formData.employees_count}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Number of employees (if any)"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Purpose of Funding *</label>
                  <textarea
                    className="form-control"
                    name="funding_purpose"
                    rows="3"
                    value={formData.funding_purpose}
                    onChange={handleInputChange}
                    required
                    placeholder="How will you use this funding? (e.g., equipment, inventory, expansion)"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-control"
                    name="additional_notes"
                    rows="2"
                    value={formData.additional_notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information you'd like to share..."
                  ></textarea>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
