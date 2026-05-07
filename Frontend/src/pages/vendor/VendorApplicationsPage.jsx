import { useEffect, useState } from "react";
import { FiList } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";

export default function VendorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/applications/mine");
        setApplications(data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="container py-4">
      <PageTitle
        title="My Applications"
        subtitle="Monitor submission status and admin feedback"
        icon={FiList}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading your applications..." /> : null}
      {!loading ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Zone</th>
                  <th>Stall Type</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.application_ref}</td>
                    <td>{app.desired_zone}</td>
                    <td>{app.stall_type}</td>
                    <td className="text-capitalize">{app.status}</td>
                    <td>{app.admin_remarks || "-"}</td>
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
