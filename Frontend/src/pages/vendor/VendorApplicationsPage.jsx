import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiEye,
  FiList,
  FiRotateCw,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorApplicationsPage.css";

export default function VendorApplicationsPage() {
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    approved: 0,
    rejected: 0,
  });
  const [currentZone, setCurrentZone] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [supportsAdvancedRoutes, setSupportsAdvancedRoutes] = useState(true);

  const approvedZoneIds = useMemo(
    () =>
      new Set(
        applications
          .filter((app) => app.status?.toLowerCase() === "approved")
          .map((app) => app.id),
      ),
    [applications],
  );

  async function loadData() {
    try {
      const res = await api.get("/vendor/total-applications");
      setSupportsAdvancedRoutes(true);
      setMessage("");
      setSummary(
        res.data.summary || {
          total: 0,
          draft: 0,
          approved: 0,
          rejected: 0,
        },
      );
      setCurrentZone(res.data.current_zone || null);
      setApplications(res.data.applications || []);
    } catch (err) {
      const isRouteMissing =
        err.response?.status === 404 &&
        String(err.response?.data?.message || "")
          .toLowerCase()
          .includes("route not found");

      if (!isRouteMissing) {
        throw err;
      }

      // Backward-compatibility for servers that don't yet expose /vendor/total-applications.
      const fallbackRes = await api.get("/vendor/dashboard");
      const fallbackApps = fallbackRes.data?.applications || [];

      setSupportsAdvancedRoutes(false);
      setApplications(fallbackApps);
      setCurrentZone(fallbackRes.data?.profile?.vending_zone || null);
      setSummary({
        total: fallbackApps.length,
        draft: fallbackApps.filter(
          (app) => (app.status || "").toLowerCase() === "draft",
        ).length,
        approved: fallbackApps.filter(
          (app) => (app.status || "").toLowerCase() === "approved",
        ).length,
        rejected: fallbackApps.filter(
          (app) => (app.status || "").toLowerCase() === "rejected",
        ).length,
      });
      setMessage(
        "Running in compatibility mode. Restart backend to enable draft delete and zone switching.",
      );
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const deleteDraft = async (applicationId) => {
    try {
      setError("");
      setMessage("");
      setBusyId(applicationId);
      await api.delete(`/vendor/applications/${applicationId}`);
      setSupportsAdvancedRoutes(true);
      setMessage("Draft application deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete draft application",
      );
    } finally {
      setBusyId(null);
    }
  };

  const switchZone = async (applicationId) => {
    try {
      setError("");
      setMessage("");
      setBusyId(applicationId);
      const res = await api.patch(
        `/vendor/applications/${applicationId}/switch-zone`,
      );
      setSupportsAdvancedRoutes(true);
      setMessage(res.data?.message || "Active zone switched successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to switch active zone");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Total Applications"
        subtitle="See your application totals, remove drafts, and switch approved vending zones"
        icon={FiList}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {loading ? <LoadingState label="Loading applications..." /> : null}
      {!loading ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm app-surface-card app-summary-card">
                <div className="text-muted small">Total Applied</div>
                <div className="app-summary-value">{summary.total}</div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm app-surface-card app-summary-card">
                <div className="text-muted small">Drift (Draft)</div>
                <div className="app-summary-value">{summary.draft}</div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm app-surface-card app-summary-card">
                <div className="text-muted small">Approved</div>
                <div className="app-summary-value text-success">
                  {summary.approved}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm app-surface-card app-summary-card">
                <div className="text-muted small">Rejected</div>
                <div className="app-summary-value text-danger">
                  {summary.rejected}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm app-surface-card mb-4">
            <div className="card-body p-3 p-md-4">
              <div className="small text-muted">
                Current active vending zone
              </div>
              <div className="fw-semibold">{currentZone || "-"}</div>
            </div>
          </div>

          <div className="card border-0 shadow-sm app-surface-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Zone</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const normalizedStatus = (app.status || "").toLowerCase();
                    const isDraft = normalizedStatus === "draft";
                    const isApproved = normalizedStatus === "approved";
                    const isCurrentZone =
                      isApproved &&
                      currentZone &&
                      app.desired_zone === currentZone;

                    return (
                      <tr key={app.id}>
                        <td>{app.application_ref}</td>
                        <td>{app.desired_zone || "-"}</td>
                        <td className="text-capitalize">{app.status || "-"}</td>
                        <td>
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Link
                              to={`/vendor/track/${app.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FiEye className="me-1" />
                              Track
                            </Link>

                            {isDraft && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteDraft(app.id)}
                                disabled={busyId === app.id}
                              >
                                <FiTrash2 className="me-1" />
                                Delete Draft
                              </button>
                            )}

                            {isApproved && !isCurrentZone && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => switchZone(app.id)}
                                disabled={busyId === app.id}
                              >
                                <FiRotateCw className="me-1" />
                                Switch Zone
                              </button>
                            )}

                            {isApproved && isCurrentZone && (
                              <span className="badge bg-success-subtle text-success border app-inline-badge">
                                <FiCheckCircle className="me-1" />
                                Active Zone
                              </span>
                            )}

                            {normalizedStatus === "rejected" && (
                              <span className="badge bg-danger-subtle text-danger border app-inline-badge">
                                <FiXCircle className="me-1" />
                                Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        </>
      ) : null}
    </VendorLayout>
  );
}
