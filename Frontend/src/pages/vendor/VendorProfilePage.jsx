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
  const [documentFiles, setDocumentFiles] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [displayDateOfBirth, setDisplayDateOfBirth] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data } = await api.get("/vendor/profile");
      console.log("Full profile data received:", data);
      if (data.profile) {
        console.log("Profile object:", data.profile);
        // Format date for HTML date input (YYYY-MM-DD) - avoid timezone issues
        let formattedDate = "";
        let displayDate = "";
        if (data.profile.date_of_birth) {
          console.log("Raw date_of_birth from backend:", data.profile.date_of_birth);
          // Parse the date and extract YYYY-MM-DD part, handling both formats
          const date = new Date(data.profile.date_of_birth);
          console.log("Parsed date object:", date);
          if (!isNaN(date.getTime())) {
            // Use UTC methods to avoid timezone shift
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
            // Format for display as MM/DD/YYYY
            displayDate = `${month}/${day}/${year}`;
            console.log("Formatted date (input):", formattedDate);
            console.log("Display date:", displayDate);
          }
        }

        setForm({
          firstName: data.profile.first_name || "",
          lastName: data.profile.last_name || "",
          phone: data.profile.phone || "",
          nationalId: data.profile.national_id || "",
          dateOfBirth: formattedDate,
          address: data.profile.address || "",
          businessName: data.profile.business_name || "",
          businessType: data.profile.business_type || "",
          vendingZone: data.profile.vending_zone || "",
        });
        setDisplayDateOfBirth(displayDate);

        if (data.profile.profile_picture_url) {
          console.log("Profile picture URL from backend:", data.profile.profile_picture_url);
          // Construct full URL for profile picture if it's a relative path
          let picUrl = data.profile.profile_picture_url;
          if (!picUrl.startsWith('http')) {
            // Backend is on port 8080, construct the full URL
            picUrl = `http://localhost:8080${picUrl}`;
          }
          console.log("Final profile picture URL:", picUrl);
          setProfilePicturePreview(picUrl);
          console.log("setProfilePicturePreview called with:", picUrl);
          // Test if the image loads
          const img = new Image();
          img.onload = () => console.log("Profile picture loaded successfully");
          img.onerror = (e) => console.error("Profile picture failed to load", e);
          img.src = picUrl;
        } else {
          console.log("No profile picture URL found in profile data. Profile keys:", Object.keys(data.profile));
        }
      } else {
        console.log("No profile data received");
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

  const onDocumentChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Max 5MB allowed.`);
        return false;
      }
      return true;
    });
    setDocumentFiles((prev) => [...prev, ...validFiles]);
  };

  const uploadDocuments = async () => {
    if (documentFiles.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploadingDocuments(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    documentFiles.forEach((file) => {
      // Determine document type based on file name or use a default
      let docType = "other_document";
      const fileName = file.name.toLowerCase();
      if (fileName.includes("nid") || fileName.includes("national")) {
        docType = "national_id_copy";
      } else if (fileName.includes("trade") || fileName.includes("license")) {
        docType = "trade_license";
      } else if (fileName.includes("profile")) {
        docType = "profile_photo";
      }
      formData.append(docType, file);
    });

    try {
      const { data } = await api.post("/vendor/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message || "Documents uploaded successfully!");
      setDocumentFiles([]);
      loadProfileData(); // Reload to show uploaded documents
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload documents");
    } finally {
      setUploadingDocuments(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      const { data } = await api.put("/vendor/change-password", {
        currentPassword,
        newPassword,
      });
      setMessage(data.message || "Password changed successfully!");
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  const onDeactivateAccount = async () => {
    if (!window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
      return;
    }

    try {
      const { data } = await api.put("/vendor/deactivate-account");
      setMessage(data.message || "Account deactivated successfully");
      setTimeout(() => {
        localStorage.removeItem("hawker_token");
        localStorage.removeItem("hawker_user");
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate account");
    }
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
      setError(err.response?.data?.message || "Failed to save profile");

      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
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
                onClick={() => document.getElementById("document-input").click()}
              >
                <FiUploadCloud size={48} className="text-primary mb-2" />
                <h6>Drop your documents here or click to upload</h6>
                <small className="text-muted">
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </small>
                <input
                  type="file"
                  id="document-input"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onDocumentChange}
                  style={{ display: "none" }}
                />
              </div>

              {documentFiles.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-3">Selected Files</h6>
                  <div className="row g-2">
                    {documentFiles.map((file, idx) => (
                      <div key={idx} className="col-md-6">
                        <div
                          style={{
                            background: "#f8fbff",
                            border: "1px solid #d5e3f3",
                            borderRadius: "8px",
                            padding: "0.75rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <small className="text-truncate" style={{ maxWidth: "200px" }}>
                            {file.name}
                          </small>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setDocumentFiles((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={uploadDocuments}
                      disabled={uploadingDocuments}
                      className="btn btn-warning px-4 rounded-pill"
                    >
                      {uploadingDocuments ? "Uploading..." : "Upload Documents"}
                    </button>
                  </div>
                </div>
              )}

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
              <form onSubmit={onChangePassword}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-500">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-500">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-control"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-500">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-warning px-4 rounded-pill">
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
              <div className="col-12 mt-4 pt-3 border-top">
                <h6 className="mb-3">Danger Zone</h6>
                <button
                  onClick={onDeactivateAccount}
                  className="btn btn-outline-danger px-4 rounded-pill"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
