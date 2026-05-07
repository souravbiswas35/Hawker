import { useEffect, useState } from "react";
import { FiCheckSquare } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function fetchApplications() {
    try {
      const { data } = await api.get("/admin/applications");
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    setError("");
    try {
      await api.patch(`/admin/applications/${id}/review`, {
        status,
        remarks: `Marked as ${status}`,
      });
      await fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container py-4">
      <PageTitle
        title="Review Applications"
        subtitle="Approve, reject, or request more information"
        icon={FiCheckSquare}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <LoadingState label="Loading applications for review..." />
      ) : null}

      {!loading ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Vendor</th>
                  <th>Business</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.application_ref}</td>
                    <td>{app.email}</td>
                    <td>{app.business_name || "-"}</td>
                    <td className="text-capitalize">{app.status}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-success"
                          disabled={savingId === app.id}
                          onClick={() => updateStatus(app.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          disabled={savingId === app.id}
                          onClick={() => updateStatus(app.id, "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          disabled={savingId === app.id}
                          onClick={() => updateStatus(app.id, "needs-info")}
                        >
                          Need Info
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
