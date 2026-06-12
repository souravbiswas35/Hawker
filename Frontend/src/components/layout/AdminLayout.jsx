import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiBarChart2,
  FiMessageSquare,
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import api from "../../api/client";
import ThemeToggle from "../common/ThemeToggle";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    // Admin doesn't have profile picture endpoint yet, so we'll use a placeholder
    // This can be enhanced later when admin profile pictures are implemented
  }, []);

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const toggleExpand = (title) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isAnySubItemActive = (subItems) => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.path));
  };

  const handleLogout = () => {
    localStorage.removeItem("hawker_token");
    localStorage.removeItem("hawker_user");
    navigate("/login");
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: FiHome,
      path: "/admin/dashboard",
      badge: null,
    },
    {
      title: "Applications",
      icon: FiFileText,
      path: "/admin/applications",
      badge: null,
    },
    {
      title: "Vendors",
      icon: FiUsers,
      path: "/admin/vendors",
      badge: null,
    },
    {
      title: "Reports",
      icon: FiBarChart2,
      path: "/admin/analytics",
      badge: null,
    },
    {
      title: "Notifications",
      icon: FiMessageSquare,
      path: "/admin/notifications",
      badge: null,
    },
    {
      title: "Complaints",
      icon: FiMessageSquare,
      path: "/admin/complaints",
      badge: null,
    },
    {
      title: "Feedbacks",
      icon: FiMessageSquare,
      path: "/admin/feedback",
      badge: null,
    },
    {
      title: "Announcements",
      icon: FiMessageSquare,
      path: "/admin/announcements",
      badge: null,
    },
    {
      title: "Payments",
      icon: FiDollarSign,
      path: "/admin/payments",
      badge: null,
    },
    {
      title: "Inspections",
      icon: FiCalendar,
      path: "/admin/inspections",
      badge: null,
    },
    {
      title: "Zones",
      icon: FiMapPin,
      path: "/admin/zones-management",
      badge: null,
    },
    {
      title: "Women Vendor Support",
      icon: FiShield,
      path: "/admin/women-support",
      badge: null,
      subItems: [
        {
          title: "Scheme Applications",
          path: "/admin/women-support/scheme-applications",
        },
        {
          title: "Mentorship Applications",
          path: "/admin/women-support/mentorship-applications",
        },
        {
          title: "Success Stories",
          path: "/admin/women-support/success-stories",
        },
        {
          title: "Community Posts",
          path: "/admin/women-support/community-posts",
        },
      ],
    },
    {
      title: "Logout",
      icon: FiLogOut,
      path: "/logout",
      badge: null,
      isLogout: true,
    },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="d-lg-none position-fixed top-0 start-0 end-0 z-1050 hawker-nav p-3 d-flex align-items-center justify-content-between" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-link text-light"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div className="d-flex align-items-center gap-1">
          <img
            src="/images/logo.png"
            alt="logo"
            style={{ height: "32px", width: "32px" }}
          />
          <span className="fw-bold text-light">Hawker</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile Overlay */}
      <div
        className={`admin-sidebar-overlay d-lg-none ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="admin-sidebar-header">
          <p className="vendor-nav-label">Main Menu</p>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item, index) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems[item.title] || isAnySubItemActive(item.subItems);
            const isItemActive = isActive(item.path);
            const isLogout = item.isLogout;

            if (isLogout) {
              return (
                <button
                  key={index}
                  className="admin-nav-item text-danger border-0 bg-transparent w-100 text-start"
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
                  <item.icon className="admin-nav-icon" />
                  <span className="admin-nav-text">{item.title}</span>
                </button>
              );
            }

            if (hasSubItems) {
              return (
                <div key={index}>
                  <button
                    className={`admin-nav-item ${isAnySubItemActive(item.subItems) ? "active" : ""}`}
                    onClick={() => toggleExpand(item.title)}
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <item.icon className="admin-nav-icon" />
                    <span className="admin-nav-text">{item.title}</span>
                    <span style={{ marginLeft: "auto" }}>
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="admin-subnav">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`admin-subnav-item ${isActive(subItem.path) ? "active" : ""}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={index}
                to={item.path}
                className={`admin-nav-item ${isItemActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="admin-nav-icon" />
                <span className="admin-nav-text">{item.title}</span>
                {item.badge && (
                  <span className="admin-nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Page Content */}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
