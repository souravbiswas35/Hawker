import { useState, useEffect } from "react";
import { FiUser } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";

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
  const [loading, setLoading] = useState(true);

  // Load existing profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Try API first - use dashboard endpoint which includes profile
        const { data } = await api.get("/vendor/dashboard");
        console.log("Dashboard API response:", data); // Debug log
        
        // Extract profile from dashboard response
        const profileData = data.profile;
        console.log("Profile data extracted:", profileData); // Debug log
        
        if (profileData) {
          setForm({
            firstName: profileData.first_name || profileData.firstName || "",
            lastName: profileData.last_name || profileData.lastName || "",
            phone: profileData.phone || "",
            nationalId: profileData.national_id || profileData.nationalId || "",
            dateOfBirth: profileData.date_of_birth || profileData.dateOfBirth || "",
            address: profileData.address || "",
            businessName: profileData.business_name || profileData.businessName || "",
            businessType: profileData.business_type || profileData.businessType || "",
            vendingZone: profileData.vending_zone || profileData.vendingZone || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile from API:", err);
        console.error("Error response:", err.response?.data); // Debug error response
        
        // Fallback to localStorage
        try {
          const savedProfile = localStorage.getItem("vendor_profile");
          if (savedProfile) {
            const profileData = JSON.parse(savedProfile);
            console.log("Loading profile from localStorage:", profileData);
            setForm({
              firstName: profileData.firstName || "",
              lastName: profileData.lastName || "",
              phone: profileData.phone || "",
              nationalId: profileData.nationalId || "",
              dateOfBirth: profileData.dateOfBirth || "",
              address: profileData.address || "",
              businessName: profileData.businessName || "",
              businessType: profileData.businessType || "",
              vendingZone: profileData.vendingZone || "",
            });
          }
        } catch (localErr) {
          console.error("Failed to load from localStorage:", localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    console.log("Saving profile data:", form); // Debug what's being sent
    
    try {
      const { data } = await api.put("/vendor/profile", form);
      console.log("Save response:", data); // Debug save response
      setMessage(data.message || "Profile updated successfully!");
      
      // Save to localStorage as backup after successful API save
      localStorage.setItem("vendor_profile", JSON.stringify(form));
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
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

  return (
    <VendorLayout>
      <PageTitle
        title="My Profile"
        subtitle="Update your personal and business information"
        icon={FiUser}
        className="mb-4"
      />
      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading profile...</span>
              </div>
              <p className="mt-2 text-muted">Loading profile information...</p>
            </div>
          ) : (
            <>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input
                className="form-control"
                name="firstName"
                value={form.firstName}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input
                className="form-control"
                name="lastName"
                value={form.lastName}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">National ID</label>
              <input
                className="form-control"
                name="nationalId"
                value={form.nationalId}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Business Name</label>
              <input
                className="form-control"
                name="businessName"
                value={form.businessName}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Business Type</label>
              <input
                className="form-control"
                name="businessType"
                value={form.businessType}
                onChange={onChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Vending Zone</label>
              <input
                className="form-control"
                name="vendingZone"
                value={form.vendingZone}
                onChange={onChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows="3"
                name="address"
                value={form.address}
                onChange={onChange}
              />
            </div>
            <div className="col-12">
              <button className="btn btn-warning px-4 rounded-pill">
                Save Profile
              </button>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
