import { useEffect, useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, recentApplications: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/admin/dashboard");
        setData(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load admin dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="container py-4">
      <PageTitle
        title="Admin Dashboard"
        subtitle="Operational analytics and recent application activity"
        icon={FiBarChart2}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading admin analytics..." /> : null}

      {!loading ? (
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="metric-card">
              <span>Total Vendors</span>
              <h3>{data.stats.total_vendors || 0}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <span>Total Applications</span>
              <h3>{data.stats.total_applications || 0}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <span>Pending</span>
              <h3>{data.stats.pending_applications || 0}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="metric-card">
              <span>Approved</span>
              <h3>{data.stats.approved_applications || 0}</h3>
            </div>
          </div>
        </div>
      ) : null}

      {!loading ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="card-body">
            <h5 className="mb-3">Recent Applications</h5>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Vendor Email</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentApplications || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.application_ref}</td>
                      <td>{item.email}</td>
                      <td className="text-capitalize">{item.status}</td>
                      <td>
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(data.recentApplications || []).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-muted">
                        No applications yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
