import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiBell,
  FiClock,
  FiMapPin,
  FiShield,
  FiX,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiFileText,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import { useAuth } from "../../context/AuthContext";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorDashboardPage.css";

function formatDateLabel(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNotificationColor(message) {
  const lowerMessage = message?.toLowerCase() || "";

  if (lowerMessage.includes("approved")) {
    return { bg: "bg-success bg-opacity-10", text: "text-success", border: "border-success", icon: <FiCheck size={18} /> };
  }

  if (lowerMessage.includes("rejected")) {
    return { bg: "bg-danger bg-opacity-10", text: "text-danger", border: "border-danger", icon: <FiX size={18} /> };
  }

  if (lowerMessage.includes("pending")) {
    return { bg: "bg-warning bg-opacity-10", text: "text-warning", border: "border-warning", icon: <FiClock size={18} /> };
  }

  if (lowerMessage.includes("uploaded")) {
    return { bg: "bg-info bg-opacity-10", text: "text-info", border: "border-info", icon: <FiFileText size={18} /> };
  }

  // Default
  return { bg: "bg-secondary bg-opacity-10", text: "text-secondary", border: "border-secondary", icon: <FiBell size={18} /> };
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
  const [zoneData, setZoneData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(true);
  const [hiddenNotifications, setHiddenNotifications] = useState([]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleHideNotification = (notificationId) => {
    setHiddenNotifications([...hiddenNotifications, notificationId]);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/vendor/dashboard");
        setData(res.data);
        
        // Load zone data if vendor has a zone assigned
        if (res.data.profile?.vending_zone) {
          try {
            const zonesRes = await api.get("/vendor/zones");
            const zone = zonesRes.data.zones?.find(
              z => z.name === res.data.profile.vending_zone
            );
            if (zone) {
              setZoneData(zone);
            }
          } catch (err) {
            console.error("Failed to load zone data:", err);
          }
        }

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
    const approvedApp = data.applications.find(
      (app) => app.status?.toLowerCase() === "approved",
    );
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

    console.log('Total items before filtering:', items.length);
    console.log('Applications:', data.applications.length);
    console.log('Documents:', data.documents.length);

    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [data.applications, data.documents]);

  const visibleNotifications = notifications.filter(n => !hiddenNotifications.includes(n.id));


  const reminders = [];
  if (
    renewalInfo?.daysLeft !== null &&
    renewalInfo?.daysLeft <= 30 &&
    licenseStatus === "Active"
  ) {
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
    data.profile?.first_name ||
    data.profile?.business_name ||
    user?.name ||
    "Vendor";

  return (
    <VendorLayout>
      <PageTitle
        title="Vendor Dashboard"
        subtitle="Welcome back — manage your license, payments, and zone details from one place."
        icon={FiActivity}
        iconSize={62}
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
                    Here's what's happening with your vending license and zone
                    allocation.
                  </p>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm h-100">
                        <div className="bg-success bg-opacity-10 p-2 rounded-2 me-3 flex-shrink-0">
                          <FiShield className="text-success fs-4" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small text-truncate">License Status</div>
                          <div className="fw-bold text-capitalize text-truncate">
                            {licenseStatus}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm h-100">
                        <div className="bg-warning bg-opacity-10 p-2 rounded-2 me-3 flex-shrink-0">
                          <FiClock className="text-warning fs-4" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small text-truncate">Profile Complete</div>
                          <div className="fw-bold text-truncate">{profileCompletion}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm h-100">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-2 me-3 flex-shrink-0">
                          <FiBell className="text-primary fs-4" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small text-truncate">Documents</div>
                          <div className="fw-bold text-truncate">{data.documents.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    className="btn btn-warning btn-lg px-4 rounded-3"
                    to="/vendor/apply"
                  >
                    Apply for License <FiArrowRight className="ms-2" />
                  </Link>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="p-4">
                  {renewalInfo &&
                    renewalInfo.daysLeft !== null &&
                    renewalInfo.daysLeft <= 30 && (
                      <div className="alert alert-warning border-0 rounded-3 shadow-sm">
                        <div className="d-flex align-items-center mb-2">
                          <FiClock className="me-2" />
                          <strong>License Renewal</strong>
                        </div>
                        <div className="small">
                          Due in {renewalInfo.daysLeft} days (
                          {renewalInfo.label})
                        </div>
                        {renewalInfo.daysLeft <= 15 && (
                          <Link
                            className="btn btn-sm btn-warning mt-2 w-100"
                            to="/vendor/renew-license"
                          >
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
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="admin-stat-card mint">
                <div className="d-flex justify-content-between align-items-start">
                  <FiShield size={28} className="text-dark" />
                  <span className="admin-stat-badge mint">Active</span>
                </div>
                <div className="admin-stat-value text-dark">
                  {licenseStatus}
                </div>
                <div className="admin-stat-label text-dark">
                  Current permit standing
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="admin-stat-card yellow">
                <div className="d-flex justify-content-between align-items-start">
                  <FiClock size={28} className="text-dark" />
                  <span className="admin-stat-badge yellow">
                    {renewalInfo && renewalInfo.daysLeft !== null && renewalInfo.daysLeft <= 15 ? 'Due Soon' : 'Days'}
                  </span>
                </div>
                <div className="admin-stat-value text-dark">
                  {renewalInfo && renewalInfo.daysLeft !== null
                    ? `${renewalInfo.daysLeft}`
                    : "--"}
                </div>
                <div className="admin-stat-label text-dark">
                  Days until renewal
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="admin-stat-card coral">
                <div className="d-flex justify-content-between align-items-start">
                  <FiFileText size={28} className="text-dark" />
                  <span className="admin-stat-badge coral">{data.applications.length}</span>
                </div>
                <div className="admin-stat-value text-dark">
                  {data.applications.length}
                </div>
                <div className="admin-stat-label text-dark">
                  Total applications
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="admin-stat-card apple">
                <div className="d-flex justify-content-between align-items-start">
                  <FiMapPin size={28} className="text-dark" />
                  <span className="admin-stat-badge apple">Zone</span>
                </div>
                <div className="admin-stat-value text-dark">
                  {data.profile?.vending_zone || "Not Set"}
                </div>
                <div className="admin-stat-label text-dark">
                  Assigned zone
                </div>
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
                      <Link
                        className="dashboard-action-card"
                        to="/vendor/apply"
                      >
                        <strong>Apply License</strong>
                        <span>New application</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link
                        className="dashboard-action-card"
                        to="/vendor/renew-license"
                      >
                        <strong>Renew License</strong>
                        <span>Extend validity</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link
                        className="dashboard-action-card"
                        to="/vendor/applications"
                      >
                        <strong>Track Application</strong>
                        <span>View status</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link
                        className="dashboard-action-card"
                        to="/vendor/applications"
                      >
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
                      <p className="text-muted mb-0">
                        Last 5 updates for your account
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm btn-link text-muted p-0"
                        onClick={toggleNotifications}
                        title={showNotifications ? "Hide notifications" : "Show notifications"}
                      >
                        {showNotifications ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                      <span className="badge rounded-pill bg-secondary">
                        {visibleNotifications.length}
                      </span>
                    </div>
                  </div>

                  {showNotifications ? (
                    <div className="notification-list">
                      {visibleNotifications.map((note) => {
                        const colors = getNotificationColor(note.message);
                        return (
                          <div key={note.id} className={`notification-item ${colors.border} border-start border-3 mb-2`}>
                            <div className={`p-3 ${colors.bg} rounded`}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`fs-5 ${colors.text}`}>{colors.icon}</span>
                                  <h6 className={`mb-1 ${colors.text}`}>{note.title}</h6>
                                </div>
                                <button
                                  className="btn btn-sm btn-link text-muted p-0 ms-2"
                                  onClick={() => handleHideNotification(note.id)}
                                  title="Hide notification"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                              <p className="mb-2 text-muted small">{note.message}</p>
                              <small className={`text-muted ${colors.text} fw-semibold`}>
                                {formatDateLabel(note.date)}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                      {visibleNotifications.length === 0 && (
                        <div className="text-center text-muted py-4">
                          No recent notifications yet.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <p>Notifications are hidden. Click the eye icon to show them.</p>
                    </div>
                  )}

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
                      <strong>
                        {data.profile?.vending_zone || "Not assigned"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted d-block">Location</span>
                      <strong>
                        {data.profile?.address || "Mirpur 10, Dhaka"}
                      </strong>
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
                    <div className="dashboard-map-container">
                      <div className="map-header">
                        <h6 className="mb-1">Your Assigned Zone</h6>
                        <p className="text-muted small mb-0">
                          {data.profile?.vending_zone || "Not assigned"}
                        </p>
                      </div>
                      <div className="map-preview">
                        <iframe
                          src={`https://www.google.com/maps?q=${zoneData?.latitude || 23.8103},${zoneData?.longitude || 90.4125}&output=embed`}
                          style={{
                            width: "100%",
                            height: "300px",
                            border: "none",
                            borderRadius: "8px",
                          }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                        <div className="map-actions mt-3">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${zoneData?.latitude || 23.8103},${zoneData?.longitude || 90.4125}`,
                                "_blank",
                              )
                            }
                          >
                            <FiMapPin className="me-1" />
                            Get Directions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </VendorLayout>
  );
}

// Add styles for map preview
const mapStyles = `
    .dashboard-map-container {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      color: var(--text-primary);
    }
    
    .map-header {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-secondary);
      color: var(--text-primary);
    }
    
    .map-header h6 {
      color: var(--text-primary);
    }
    
    .map-preview {
      background: var(--bg-tertiary);
      border-radius: 8px;
      padding: 1.5rem;
      min-height: 300px;
    }
    
    .map-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .map-zones {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    
    .map-zone {
      background: #e8f5e8;
      border: 1px solid #28a745;
      border-radius: 6px;
      padding: 0.75rem;
      text-align: center;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .map-zone.assigned {
      background: #d4edda;
      border-color: #155724;
      color: #155724;
      font-weight: 600;
      box-shadow: 0 0 0 2px rgba(21, 87, 36, 0.2);
    }
    
    .map-zone.available {
      background: #e8f5e8;
      border-color: #28a745;
      color: #155724;
    }
    
    .map-zone.occupied {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }
    
    .map-zone:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .map-legend {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-primary);
    }
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid #dee2e6;
    }
    
    .legend-color.assigned {
      background: #d4edda;
      border-color: #155724;
    }
    
    .legend-color.available {
      background: #e8f5e8;
      border-color: #28a745;
    }
    
    .legend-color.occupied {
      background: #f8d7da;
      border-color: #dc3545;
    }
    
    .map-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-secondary);
    }
  `;

// Inject styles into document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = mapStyles;
  document.head.appendChild(styleSheet);
}
