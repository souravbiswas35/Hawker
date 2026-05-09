import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiArrowRight, FiBell, FiClock, FiMapPin, FiShield } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import { useAuth } from "../../context/AuthContext";
import VendorLayout from "../../components/layout/VendorLayout";

function formatDateLabel(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VendorDashboardPage() {
  const { user } = useAuth();
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

  const profileCompletion = useMemo(() => {
    const fields = [
      "first_name",
      "last_name",
      "phone",
      "address",
      "business_name",
      "business_type",
      "vending_zone",
    ];
    const filled = fields.filter((key) => data.profile?.[key]).length;
    return Math.round((filled / fields.length) * 100);
  }, [data.profile]);

  const licenseStatus = useMemo(() => {
    const statuses = data.applications.map((app) => app.status?.toLowerCase());
    if (statuses.includes("approved")) return "Active";
    if (statuses.includes("pending")) return "Pending";
    return "Expired";
  }, [data.applications]);

  const renewalInfo = useMemo(() => {
    const approvedApp = data.applications.find((app) => app.status?.toLowerCase() === "approved");
    if (!approvedApp?.reviewed_at) return null;

    const reviewedAt = new Date(approvedApp.reviewed_at);
    const nextRenewal = new Date(reviewedAt);
    nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);

    const now = new Date();
    const diffDays = Math.ceil((nextRenewal - now) / (1000 * 60 * 60 * 24));

    return {
      nextRenewal,
      daysLeft: diffDays,
      label: formatDateLabel(nextRenewal.toISOString()),
    };
  }, [data.applications]);

  const notifications = useMemo(() => {
    const items = [
      ...data.applications.map((app) => ({
        id: `app-${app.id}`,
        date: app.reviewed_at || app.submitted_at,
        title: `Application ${app.application_ref}`,
        message:
          app.status?.toLowerCase() === "approved"
            ? `Your license application for ${app.desired_zone} was approved.`
            : app.status?.toLowerCase() === "pending"
            ? `Your application is pending review.`
            : `Application status updated to ${app.status}.`,
      })),
      ...data.documents.map((doc) => ({
        id: `doc-${doc.id}`,
        date: doc.uploaded_at,
        title: `Document uploaded`,
        message: `${doc.document_type} was uploaded successfully.`,
      })),
    ];

    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [data.applications, data.documents]);

  const reminders = [];
  if (renewalInfo?.daysLeft !== null && renewalInfo?.daysLeft <= 30 && licenseStatus === "Active") {
    reminders.push(`License renewal due in ${renewalInfo.daysLeft} days.`);
  }
  if (profileCompletion < 100) {
    reminders.push("Complete your profile to speed up approvals.");
  }

  const dueMessage =
    licenseStatus === "Expired"
      ? "Your license has expired. Renew now to stay compliant."
      : licenseStatus === "Pending"
      ? "A pending application needs your attention to complete payment and verification."
      : "Your account is in good standing. Keep documents current.";

  const vendorName =
    data.profile?.first_name || data.profile?.business_name || user?.name || "Vendor";

  return (
    <VendorLayout>
      <PageTitle
        title="Vendor Dashboard"
        subtitle="Welcome back — manage your license, payments, and zone details from one place."
        icon={FiActivity}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading dashboard insights..." /> : null}

      {!loading && (
        <>
          {/* Modern Hero Section */}
          <div className="dashboard-hero-modern mb-4">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="p-4">
                  <h1 className="mb-3">Welcome back, {vendorName} 👋</h1>
                  <p className="text-muted mb-4 fs-5">
                    Here's what's happening with your vending license and zone allocation.
                  </p>
                  <div className="d-flex flex-wrap gap-3 mb-4">
                    <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm">
                      <div className="bg-success bg-opacity-10 p-2 rounded-2 me-3">
                        <FiShield className="text-success fs-4" />
                      </div>
                      <div>
                        <div className="text-muted small">License Status</div>
                        <div className="fw-bold text-capitalize">{licenseStatus}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm">
                      <div className="bg-warning bg-opacity-10 p-2 rounded-2 me-3">
                        <FiClock className="text-warning fs-4" />
                      </div>
                      <div>
                        <div className="text-muted small">Profile Complete</div>
                        <div className="fw-bold">{profileCompletion}%</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm">
                      <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-3">
                        <FiBell className="text-primary fs-4" />
                      </div>
                      <div>
                        <div className="text-muted small">Documents</div>
                        <div className="fw-bold">{data.documents.length}</div>
                      </div>
                    </div>
                  </div>
                  <Link className="btn btn-warning btn-lg px-4 rounded-3" to="/vendor/apply">
                    Apply for License <FiArrowRight className="ms-2" />
                  </Link>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="p-4">
                  {renewalInfo?.daysLeft !== null && renewalInfo.daysLeft <= 30 && (
                    <div className="alert alert-warning border-0 rounded-3 shadow-sm">
                      <div className="d-flex align-items-center mb-2">
                        <FiClock className="me-2" />
                        <strong>License Renewal</strong>
                      </div>
                      <div className="small">
                        Due in {renewalInfo.daysLeft} days ({renewalInfo.label})
                      </div>
                      {renewalInfo.daysLeft <= 15 && (
                        <Link className="btn btn-sm btn-warning mt-2 w-100" to="/vendor/applications">
                          Renew Now
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="stats-card-modern h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="bg-success bg-opacity-10 p-3 rounded-3">
                    <FiShield className="text-success fs-4" />
                  </div>
                  <span className="badge bg-success text-white">Active</span>
                </div>
                <h2 className="mb-1">{licenseStatus}</h2>
                <p className="text-muted mb-0">Current permit standing</p>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="stats-card-modern h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                    <FiClock className="text-warning fs-4" />
                  </div>
                  {renewalInfo?.daysLeft !== null && renewalInfo.daysLeft <= 15 && (
                    <span className="badge bg-warning text-white">Due Soon</span>
                  )}
                </div>
                <h2 className="mb-1">
                  {renewalInfo?.daysLeft !== null ? `${renewalInfo.daysLeft}` : "--"}
                </h2>
                <p className="text-muted mb-0">Days until renewal</p>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="stats-card-modern h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                    <FiBell className="text-primary fs-4" />
                  </div>
                  <span className="badge bg-primary text-white">{data.applications.length}</span>
                </div>
                <h2 className="mb-1">{data.applications.length}</h2>
                <p className="text-muted mb-0">Total applications</p>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="stats-card-modern h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded-3">
                    <FiMapPin className="text-info fs-4" />
                  </div>
                  <span className="badge bg-info text-white">Zone</span>
                </div>
                <h2 className="mb-1">{data.profile?.vending_zone || "Not Set"}</h2>
                <p className="text-muted mb-0">Assigned zone</p>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-5">
              <div className="card border-0 shadow-sm app-surface-card h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h5 className="mb-1">Quick Actions</h5>
                      <p className="text-muted mb-0">
                        Start the next step for licensing, payments, or support.
                      </p>
                    </div>
                    <FiArrowRight className="fs-4 text-secondary" />
                  </div>
                  <div className="row g-3 mt-3">
                    <div className="col-6">
                      <Link className="dashboard-action-card" to="/vendor/apply">
                        <strong>Apply License</strong>
                        <span>New application</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link className="dashboard-action-card" to="/vendor/applications">
                        <strong>Renew License</strong>
                        <span>Extend validity</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link className="dashboard-action-card" to="/vendor/applications">
                        <strong>Pay Fees</strong>
                        <span>Make payment</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link className="dashboard-action-card" to="/faq">
                        <strong>File Complaint</strong>
                        <span>Report issue</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-7">
              <div className="card border-0 shadow-sm app-surface-card h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h5 className="mb-1">Recent Notifications</h5>
                      <p className="text-muted mb-0">Last 5 updates for your account</p>
                    </div>
                    <span className="badge rounded-pill bg-secondary">
                      {notifications.length}
                    </span>
                  </div>

                  <div className="notification-list">
                    {notifications.map((note) => (
                      <div key={note.id} className="notification-item">
                        <div>
                          <h6 className="mb-1">{note.title}</h6>
                          <p className="mb-1 text-muted">{note.message}</p>
                        </div>
                        <small className="text-muted">
                          {formatDateLabel(note.date)}
                        </small>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center text-muted py-4">
                        No recent notifications yet.
                      </div>
                    )}
                  </div>

                  <div className="alert alert-info mt-4 mb-0">
                    <strong>Payment & renewal alert:</strong> {dueMessage}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm app-surface-card mt-4">
            <div className="card-body p-4 p-xl-5">
              <div className="d-flex flex-column flex-xl-row gap-4">
                <div className="dashboard-map-info flex-fill">
                  <h5 className="mb-3">My Vending Zone</h5>
                  <div className="dashboard-map-details mb-3">
                    <div>
                      <span className="text-muted d-block">Zone</span>
                      <strong>{data.profile?.vending_zone || "Not assigned"}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block">Location</span>
                      <strong>{data.profile?.address || "Mirpur 10, Dhaka"}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block">Hours</span>
                      <strong>10 AM to 7:30 PM</strong>
                    </div>
                  </div>
                  <Link className="btn btn-success" to="/zones">
                    View Full Map
                  </Link>
                </div>
                <div className="dashboard-map-preview flex-fill">
                  <div className="dashboard-map-shell">
                    <div className="dashboard-map-placeholder">
                      <FiMapPin className="fs-1" />
                      <p className="mb-0 mt-2">Zone map preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) }
      </VendorLayout>
    );
  }
