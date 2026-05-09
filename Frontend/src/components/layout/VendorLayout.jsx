import React from 'react';
import VendorSidebar from './VendorSidebar';

export default function VendorLayout({ children }) {
  return (
    <div className="d-flex h-100">
      <VendorSidebar />
      <main className="flex-grow-1 overflow-auto">
        <div className="container-fluid py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
