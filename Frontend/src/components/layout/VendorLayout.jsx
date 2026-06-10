import React, { useState } from "react";
import VendorSidebar from "./VendorSidebar";
import { FiMenu, FiX } from "react-icons/fi";

export default function VendorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="d-lg-none position-fixed top-0 start-0 end-0 z-1050 hawker-nav p-3 d-flex align-items-center justify-content-between" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-link text-light"
          onClick={toggleSidebar}
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
      </div>

      <div
        className={`admin-sidebar-overlay d-lg-none ${sidebarOpen ? 'show' : ''}`}
        onClick={toggleSidebar}
      ></div>
      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        {/* Page Content */}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
