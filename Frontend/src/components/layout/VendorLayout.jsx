import React from "react";
import VendorSidebar from "./VendorSidebar";

export default function VendorLayout({ children }) {
  return (
    <div className="admin-layout">
      <VendorSidebar />
      <div className="admin-main">
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
