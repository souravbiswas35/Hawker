import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";

export default function VendorDashboardPage() {
  const [data, setData] = useState({
    profile: null,
    documents: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/vendor/dashboard");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="container py-4">
      <PageTitle
        title="Vendor Dashboard"
        subtitle="Track profile progress and licensing activity"
        icon={FiActivity}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading dashboard insights..." /> : null}

      {!loading ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="metric-card">
                <span>Profile Status</span>
                <h3>{data.profile ? "Completed" : "Pending"}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-card">
                <span>Documents Uploaded</span>
                <h3>{data.documents.length}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-card">
                <span>License Applications</span>
                <h3>{data.applications.length}</h3>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm app-surface-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Latest Applications</h5>
                    <Link to="/vendor/applications">View all</Link>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Ref</th>
                          <th>Zone</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.applications.slice(0, 5).map((item) => (
                          <tr key={item.id}>
                            <td>{item.application_ref}</td>
                            <td>{item.desired_zone}</td>
                            <td>
                              <span className="badge text-bg-secondary text-capitalize">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {data.applications.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-muted">
                              No applications yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100 app-surface-card">
                <div className="card-body">
                  <h5>Quick Actions</h5>
                  <div className="d-grid gap-2 mt-3">
                    <Link className="btn btn-outline-dark" to="/vendor/profile">
                      Update Profile
                    </Link>
                    <Link
                      className="btn btn-outline-dark"
                      to="/vendor/documents"
                    >
                      Upload Documents
                    </Link>
                    <Link className="btn btn-warning" to="/vendor/apply">
                      Apply for New License
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
