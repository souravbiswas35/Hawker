import { useState } from "react";
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

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/vendor/profile", form);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
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
        </div>
      </div>
    </VendorLayout>
  );
}
