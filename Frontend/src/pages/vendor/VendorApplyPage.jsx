import { useState } from "react";
import { FiFilePlus } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";

const initialForm = {
  desiredZone: "",
  stallType: "",
  businessCategory: "",
  notes: "",
};

export default function VendorApplyPage() {
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
      const { data } = await api.post("/applications", form);
      setMessage(`Application submitted. Ref: ${data.applicationRef}`);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="container py-4">
      <PageTitle
        title="Apply for License"
        subtitle="Submit your request for a new vending license"
        icon={FiFilePlus}
        className="mb-4"
      />
      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Desired Zone</label>
              <input
                className="form-control"
                name="desiredZone"
                value={form.desiredZone}
                onChange={onChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Stall Type</label>
              <input
                className="form-control"
                name="stallType"
                value={form.stallType}
                onChange={onChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Business Category</label>
              <input
                className="form-control"
                name="businessCategory"
                value={form.businessCategory}
                onChange={onChange}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-control"
                rows="4"
                name="notes"
                value={form.notes}
                onChange={onChange}
              />
            </div>
            <div className="col-12">
              <button className="btn btn-warning px-4 rounded-pill">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
