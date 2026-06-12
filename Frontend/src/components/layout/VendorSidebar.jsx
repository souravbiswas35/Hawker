import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiUsers,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiChevronDown,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";
import { FaRegListAlt } from "react-icons/fa";
import api from "../../api/client";

const navigationCategories = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: FiGrid,
    path: "/vendor/dashboard",
    subItems: [],
  },
  {
    id: "account",
    title: "My Account",
    icon: FiUser,
    subItems: [
      { title: "My Profile", path: "/vendor/profile" },
      { title: "Settings & Preferences", path: "/vendor/settings" },
      { title: "Document Vault", path: "/vendor/documents" },
    ],
  },
  {
    id: "licenses",
    title: "Licenses",
    icon: FaRegListAlt,
    subItems: [
      { title: "Apply License", path: "/vendor/apply" },
      { title: "My License", path: "/vendor/my-license" },
      { title: "Renew License", path: "/vendor/renew-license" },
      { title: "Track My Application", path: "/vendor/applications" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: FiSettings,
    subItems: [
      { title: "Payments", path: "/vendor/payments" },
      { title: "My Zone", path: "/vendor/my-zone" },
      { title: "Inspection History", path: "/vendor/inspection-history" },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: FiShoppingBag,
    subItems: [
      { title: "Payment Dashboard", path: "/vendor/payments" },
      { title: "Make Payment", path: "/vendor/payments/make" },
      { title: "Payment History", path: "/vendor/payments/history" },
    ],
  },
  {
    id: "support",
    title: "Support & Communication",
    icon: FiHelpCircle,
    subItems: [
      { title: "Notifications", path: "/vendor/notifications" },
      { title: "Complaints", path: "/vendor/complaints" },
      { title: "My Complaints Tracking", path: "/vendor/complaint-tracking" },
      { title: "Feedback & Suggestions", path: "/vendor/feedback" },
      { title: "Announcements", path: "/vendor/announcements" },
    ],
  },
  {
    id: "special",
    title: "Women Vendor Support",
    icon: FiUsers,
    subItems: [
      { title: "Women Vendor Support", path: "/vendor/women-support" },
      { title: "Community Forum", path: "/vendor/women-support/community" },
    ],
  },
];

export default function VendorSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    async function loadProfilePicture() {
      try {
        const res = await api.get("/vendor/profile");
        if (res.data.profile?.profile_picture_url) {
          try {
            const imgRes = await api.get("/vendor/profile-picture", {
              responseType: 'blob'
            });
            const imageUrl = URL.createObjectURL(imgRes.data);
            setProfilePictureUrl(imageUrl);
          } catch (imgErr) {
            console.error("Failed to load profile picture:", imgErr);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfilePicture();
  }, []);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("hawker_token");
    localStorage.removeItem("hawker_user");
    navigate("/login");
  };

  return (
    <aside className={`vendor-sidebar ${isOpen ? 'show' : ''}`}>
      {/* Header */}
      {/* <div className="admin-sidebar-header">
        <Link
          to="/vendor/dashboard"
          className="text-decoration-none d-flex align-items-center gap-2"
        >
          <FiShoppingBag className="text-primary fs-4" />
          <div>
            <div className="fw-bold" style={{ color: "var(--hawker-ink)" }}>
              StreetVendor
            </div>
            <small className="text-muted">Vendor Portal</small>
          </div>
        </Link>
      </div> */}

      {/* Nav */}
      <nav className="vendor-nav">
        <p className="vendor-nav-label">Main Menu</p>

        {navigationCategories.map((cat) => {
          const Icon = cat.icon;
          const isOpen = expanded[cat.id];
          const hasSubItems = cat.subItems.length > 0;
          const anySub = cat.subItems.some((s) => isActive(s.path));
          const directActive = !hasSubItems && isActive(cat.path);

          if (!hasSubItems) {
            return (
              <Link
                key={cat.id}
                to={cat.path}
                className={`admin-nav-item${directActive ? " active" : ""}`}
                onClick={() => {
                  if (onClose) onClose();
                }}
              >
                <Icon className="admin-nav-icon" />
                <span>{cat.title}</span>
              </Link>
            );
          }

          return (
            <div key={cat.id}>
              <button
                className={`vendor-nav-group${anySub ? " active" : ""}`}
                onClick={() => toggle(cat.id)}
                aria-expanded={isOpen}
              >
                <span className="d-flex align-items-center gap-2">
                  <Icon className="admin-nav-icon" />
                  {cat.title}
                </span>
                <FiChevronDown
                  className={`vendor-nav-chevron${isOpen ? " open" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="vendor-subnav">
                  {cat.subItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`vendor-subnav-item${isActive(item.path) ? " active" : ""}`}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <button
          className="admin-nav-item text-danger w-100 border-0 bg-transparent text-start"
          onClick={handleLogout}
          style={{
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          <FiLogOut className="admin-nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
