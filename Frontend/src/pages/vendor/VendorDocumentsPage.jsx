import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import api from "../../api/client";
import PageTitle from "../../components/common/PageTitle";

export default function VendorDocumentsPage() {
  const [files, setFiles] = useState({
    national_id_copy: null,
    trade_license: null,
    profile_photo: null,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFile = (e) => {
    setFiles((prev) => ({
      ...prev,
      [e.target.name]: e.target.files[0] || null,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    if ([...formData.keys()].length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/vendor/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <PageTitle
        title="Upload Documents"
        subtitle="Submit required files for license review"
        icon={FiUploadCloud}
        className="mb-4"
      />
      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">National ID Copy</label>
              <input
                className="form-control"
                type="file"
                name="national_id_copy"
                onChange={onFile}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Trade License</label>
              <input
                className="form-control"
                type="file"
                name="trade_license"
                onChange={onFile}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Profile Photo</label>
              <input
                className="form-control"
                type="file"
                name="profile_photo"
                onChange={onFile}
              />
            </div>
            <div className="col-12">
              <button
                disabled={loading}
                className="btn btn-warning px-4 rounded-pill"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
          <small className="text-muted mt-3 d-block">
            Allowed types: PDF, JPG, PNG. Max size 5MB each.
          </small>
        </div>
      </div>
    </div>
  );
}
