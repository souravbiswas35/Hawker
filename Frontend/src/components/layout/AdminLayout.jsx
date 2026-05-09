import { useState } from "react";
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
} from "react-icons/fi";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
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
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Toggle */}
      <div className="admin-header-mobile d-lg-none">
        <div className="d-flex justify-content-between align-items-center p-3">
          <div className="d-flex align-items-center">
            <FiShield className="text-primary fs-4 me-2" />
            <span className="fw-bold">Admin Panel</span>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="d-flex align-items-center">
            <FiShield className="text-primary fs-3 me-2" />
            <div>
              <h5 className="mb-0">Admin Panel</h5>
              <small className="text-muted">Hawker Management System</small>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="admin-nav-icon" />
              <span className="admin-nav-text">{item.title}</span>
              {item.badge && (
                <span className="admin-nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item text-danger border-0 bg-transparent w-100 text-start"
            onClick={handleLogout}
          >
            <FiLogOut className="admin-nav-icon" />
            <span className="admin-nav-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Desktop Header */}
        <div className="admin-header d-none d-lg-flex align-items-center justify-content-between">
          <div>
            <p className="text-uppercase text-muted mb-1 small">
              Admin Control Center
            </p>
            <h4 className="mb-0">Welcome back, Administrator</h4>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm">
              Reports
            </button>
            <button className="btn btn-warning btn-sm">Create Report</button>
          </div>
        </div>

        {/* Page Content */}
        <div className="admin-content">{children}</div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay d-lg-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
