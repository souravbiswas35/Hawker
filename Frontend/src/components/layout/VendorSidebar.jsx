import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiUsers,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";
import { FaRegListAlt, FaChevronDown } from "react-icons/fa";

export default function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Main navigation categories with sub-items
  const navigationCategories = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: FiGrid,
      path: '/vendor/dashboard',
      subItems: []
    },
    {
      id: 'account',
      title: 'My Account',
      icon: FiUser,
      subItems: [
        { title: 'My Profile', path: '/vendor/profile' },
        { title: 'Settings & Preferences', path: '/vendor/settings' },
        { title: 'Document Vault', path: '/vendor/documents' }
      ]
    },
    {
      id: 'licenses',
      title: 'Licenses',
      icon: FaRegListAlt,
      subItems: [
        { title: 'Apply License', path: '/vendor/apply' },
        { title: 'My License', path: '/vendor/my-license' },
        { title: 'Renew License', path: '/vendor/renew-license' },
        { title: 'Track My Application', path: '/vendor/track-application' }
      ]
    },
    {
      id: 'operations',
      title: 'Operations',
      icon: FiSettings,
      subItems: [
        { title: 'Payments', path: '/vendor/payments' },
        { title: 'My Zone', path: '/vendor/my-zone' },
        { title: 'Inspection History', path: '/vendor/inspection-history' }
      ]
    },
    {
      id: 'support',
      title: 'Support & Communication',
      icon: FiHelpCircle,
      subItems: [
        { title: 'Notifications', path: '/vendor/notifications' },
        { title: 'Complaints', path: '/vendor/complaints' },
        { title: 'My Complaints Tracking', path: '/vendor/complaint-tracking' },
        { title: 'Help & Support', path: '/vendor/help' },
        { title: 'Feedback & Suggestions', path: '/vendor/feedback' },
        { title: 'Announcements', path: '/vendor/announcements' }
      ]
    },
    {
      id: 'special',
      title: 'Women Vendor Support',
      icon: FiUsers,
      subItems: [
        { title: 'Women Vendor Support', path: '/vendor/women-support' }
      ]
    }
  ];

  const handleLogout = () => {
    // Clear any stored auth data
    localStorage.removeItem('hawker_token');
    localStorage.removeItem('hawker_user');
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column h-100" style={{ width: '280px' }}>
      {/* Logo Section */}
      <div className="p-3 border-bottom">
        <Link to="/vendor/dashboard" className="text-decoration-none">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shop fs-4 text-warning" />
            <span className="fw-bold text-light">StreetVendor</span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-grow-1 overflow-auto">
        <div className="px-3 py-2">
          <h6 className="text-uppercase text-muted small mb-3">Main Menu</h6>
          
          {navigationCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[category.id];
            const isCategoryActive = category.subItems.some(item => isActive(item.path));

            return (
              <div key={category.id} className="mb-2">
                {/* Category Header */}
                <div
                  className={`d-flex align-items-center justify-content-between p-2 rounded cursor-pointer ${
                    isCategoryActive ? 'bg-warning text-dark' : 'bg-secondary text-light'
                  }`}
                  onClick={() => toggleCategory(category.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Icon size={18} />
                    <span className="fw-bold">{category.title}</span>
                  </div>
                  <FaChevronDown 
                    size={14} 
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Sub-items */}
                {isExpanded && (
                  <div className="mt-1">
                    {category.subItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`d-block py-2 px-3 text-decoration-none rounded ${
                          isActive(item.path) 
                            ? 'bg-light text-dark' 
                            : 'text-light hover-bg-warning'
                        }`}
                        style={{ marginLeft: '8px' }}
                      >
                        <small className="d-block">{item.title}</small>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="px-3 py-2 border-top mt-3">
          <h6 className="text-uppercase text-muted small mb-3">Support</h6>
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-light btn-sm w-100 text-start"
              onClick={() => navigate('/vendor/help')}
            >
              <FiHelpCircle className="me-2" />
              Help & Support
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-3 border-top mt-auto">
          <button
            className="btn btn-danger w-100 text-start"
            onClick={handleLogout}
          >
            <FiLogOut className="me-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
