import { useState, useEffect } from "react";
import {
  FiUser,
  FiFileText,
  FiLock,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
  FiX,
} from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorProfilePage.css";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  nationalId: "",
  dateOfBirth: "",
  address: "",
  businessName: "",
  businessType: "",
  vendingZone: "",
};

export default function VendorProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [documents, setDocuments] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data } = await api.get("/vendor/profile");
      if (data.profile) {
        setForm({
          firstName: data.profile.first_name || "",
          lastName: data.profile.last_name || "",
          phone: data.profile.phone || "",
          nationalId: data.profile.national_id || "",
          dateOfBirth: data.profile.date_of_birth || "",
          address: data.profile.address || "",
          businessName: data.profile.business_name || "",
          businessType: data.profile.business_type || "",
          vendingZone: data.profile.vending_zone || "",
        });
        if (data.profile.profile_picture_url) {
          setProfilePicturePreview(data.profile.profile_picture_url);
        }
      }
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("profile_picture", profilePicture);

    try {
      const { data } = await api.post("/vendor/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message || "Profile picture uploaded successfully!");
      setProfilePicture(null);
      setProfilePicturePreview(data.profile_picture_url);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload profile picture",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    console.log("Saving profile data:", form); // Debug what's being sent

    try {
      const { data } = await api.put("/vendor/profile", {
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        national_id: form.nationalId,
        date_of_birth: form.dateOfBirth,
        address: form.address,
        business_name: form.businessName,
        business_type: form.businessType,
        vending_zone: form.vendingZone,
      });
      setMessage(data.message || "Profile updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      console.error("Save error response:", err.response?.data);

      // Fallback to localStorage if API fails
      try {
        localStorage.setItem("vendor_profile", JSON.stringify(form));
        console.log("Profile saved to localStorage");
        setMessage("Profile updated successfully! (Saved locally)");

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      } catch (localErr) {
        console.error("Failed to save to localStorage:", localErr);
        setError(err.response?.data?.message || "Failed to save profile");

        // Clear error after 5 seconds
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const profileCompletion = Math.round(
    (Object.values(form).filter((v) => v).length / Object.keys(form).length) *
      100,
  );

  return (
    <VendorLayout>
      <PageTitle
        title="My Profile"
        subtitle="Manage your personal and business information"
        icon={FiUser}
        className="mb-4"
      />

      {/* Profile Header */}
      <div
        className="profile-header-card mb-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(31, 122, 159, 0.95) 0%, rgba(14, 74, 147, 0.95) 100%)",
          borderRadius: "16px",
          padding: "2rem",
          color: "white",
        }}
      >
        <div className="row align-items-center g-3">
          <div className="col-auto position-relative">
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                border: "3px solid rgba(255, 255, 255, 0.3)",
                overflow: "hidden",
                backgroundImage: profilePicturePreview
                  ? `url(${profilePicturePreview})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!profilePicturePreview && <FiUser />}
            </div>
            <label
              style={{
                position: "absolute",
                bottom: "-5px",
                right: "-5px",
                background: "#ffbc42",
                border: "3px solid white",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#333",
              }}
            >
              <FiCamera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={onProfilePictureChange}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div className="col">
            <h3 className="mb-1">{form.firstName || "Your Name"}</h3>
            <p className="mb-0 text-white-50">{form.phone || "Phone number"}</p>
          </div>
          <div className="col-md-auto">
            <div
              style={{
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.1)",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {profileCompletion}%
              </div>
              <small>Profile Complete</small>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              height: "8px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #ffbc42, #ffc857)",
                width: `${profileCompletion}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Profile Picture Upload Section */}
        {profilePicture && (
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="d-flex gap-2 align-items-center">
              <span>📷 Profile picture ready to upload</span>
              <button
                onClick={uploadProfilePicture}
                disabled={uploading}
                className="btn btn-warning btn-sm rounded-pill"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={removeProfilePicture}
                className="btn btn-outline-light btn-sm rounded-pill"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {message && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
          <FiCheckCircle /> {message}
        </div>
      )}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div
        className="profile-tabs mb-4"
        style={{
          background: "white",
          borderRadius: "16px",
          borderBottom: "1px solid #d5e3f3",
          display: "flex",
          gap: "1px",
        }}
      >
        {[
          { id: "personal", label: "Personal Info", icon: FiUser },
          { id: "business", label: "Business Info", icon: FiFileText },
          { id: "documents", label: "Documents", icon: FiUploadCloud },
          { id: "security", label: "Security", icon: FiLock },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "1rem",
                border: "none",
                background: activeTab === tab.id ? "#f8fbff" : "transparent",
                borderBottom:
                  activeTab === tab.id ? "3px solid #1f7a9f" : "none",
                color: activeTab === tab.id ? "#1f7a9f" : "#607086",
                fontWeight: activeTab === tab.id ? "600" : "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontSize: "0.95rem",
                transition: "all 0.2s ease",
              }}
            >
              <TabIcon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <div
        className="card border-0 shadow-sm"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid #d5e3f3",
        }}
      >
        <div className="card-body p-4">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <form onSubmit={onSubmit}>
              <h5 className="mb-4 text-dark">Personal Information</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-500">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={form.firstName}
                    onChange={onChange}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={form.lastName}
                    onChange={onChange}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="+880 1XXXXXXXXX"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">National ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nationalId"
                    value={form.nationalId}
                    onChange={onChange}
                    placeholder="Enter NID number"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={onChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-500">Address *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    placeholder="Enter your residential address"
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-warning px-4 rounded-pill"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 rounded-pill"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Business Info Tab */}
          {activeTab === "business" && (
            <form onSubmit={onSubmit}>
              <h5 className="mb-4 text-dark">Business Information</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-500">Business Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="businessName"
                    value={form.businessName}
                    onChange={onChange}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">Business Type *</label>
                  <select
                    className="form-control"
                    name="businessType"
                    value={form.businessType}
                    onChange={onChange}
                  >
                    <option value="">Select business type</option>
                    <option value="food">Food & Beverages</option>
                    <option value="retail">Retail & Goods</option>
                    <option value="service">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-500">Vending Zone *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="vendingZone"
                    value={form.vendingZone}
                    onChange={onChange}
                    placeholder="Enter assigned zone"
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-warning px-4 rounded-pill"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 rounded-pill"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <h5 className="mb-4 text-dark">Document Management</h5>
              <div
                style={{
                  border: "2px dashed #1f7a9f",
                  borderRadius: "12px",
                  padding: "2rem",
                  textAlign: "center",
                  background: "rgba(31, 122, 159, 0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: "2rem",
                }}
                className="document-upload-area"
              >
                <FiUploadCloud size={48} className="text-primary mb-2" />
                <h6>Drop your documents here or click to upload</h6>
                <small className="text-muted">
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </small>
              </div>
              <h6 className="mb-3">Uploaded Documents</h6>
              <div className="row g-3">
                {documents.length > 0 ? (
                  documents.map((doc, idx) => (
                    <div key={idx} className="col-md-6">
                      <div
                        style={{
                          background: "#f8fbff",
                          border: "1px solid #d5e3f3",
                          borderRadius: "12px",
                          padding: "1rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div className="fw-500">{doc.document_type}</div>
                          <small className="text-muted">
                            {doc.original_name}
                          </small>
                        </div>
                        <span
                          style={{
                            background: "#d4edda",
                            color: "#155724",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                          }}
                        >
                          Uploaded
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center text-muted py-4">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div>
              <h5 className="mb-4 text-dark">Security Settings</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-500">Change Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Current password"
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New password"
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="col-12">
                  <button className="btn btn-warning px-4 rounded-pill">
                    Update Password
                  </button>
                </div>
                <div className="col-12 mt-4 pt-3 border-top">
                  <h6 className="mb-3">Danger Zone</h6>
                  <button className="btn btn-outline-danger px-4 rounded-pill">
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
