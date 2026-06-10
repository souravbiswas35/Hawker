import { useState, useEffect } from "react";
import { FiSettings, FiSun, FiMoon, FiMonitor, FiGlobe, FiBell, FiShield, FiCreditCard, FiEye, FiLock, FiDownload, FiAlertTriangle, FiCheck, FiX, FiMenu, FiX as FiClose } from "react-icons/fi";
import VendorLayout from "../../components/layout/VendorLayout";
import PageTitle from "../../components/common/PageTitle";
import api from "../../api/client";
import "../../styles/pages/vendor/VendorSettingsPage.css";

export default function VendorSettingsPage() {
  // Theme Selection
  const [theme, setTheme] = useState("light");
  
  // Language Selection
  const [language, setLanguage] = useState("english");
  
  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    licenseRenewal: true,
    paymentConfirmations: false,
    applicationStatus: true,
    systemAnnouncements: true,
    marketing: false,
  });
  
  // Security Settings
  const [security, setSecurity] = useState({
    twoFactor: false,
  });
  
  // Payment & Renewal
  const [paymentSettings, setPaymentSettings] = useState({
    autoRenewal: true,
    savePaymentMethods: true,
    emailReceipts: true,
  });
  
  // Accessibility
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false,
  });
  
  // Privacy & Data
  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
  });

  // Load settings from backend on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        // Load theme from localStorage first for immediate persistence
        const savedTheme = localStorage.getItem("vendor_theme");
        if (savedTheme) {
          setTheme(savedTheme);
          handleThemeChange(savedTheme);
        }

        const res = await api.get("/vendor/settings");
        const data = res.data;
        
        // Update state with loaded settings
        if (data.theme) {
          setTheme(data.theme);
          handleThemeChange(data.theme);
        }
        setLanguage(data.language || "english");
        
        setAccessibility({
          highContrast: data.high_contrast_mode || false,
          largeText: data.large_text || false,
          screenReader: data.screen_reader_support || false,
        });
        
        setPrivacy({
          profileVisibility: data.profile_visibility !== false,
        });
        
        setPaymentSettings({
          autoRenewal: data.auto_renewal !== false,
          savePaymentMethods: data.save_payment_methods !== false,
          emailReceipts: data.email_receipts !== false,
        });
        
        setSecurity({
          twoFactor: data.two_factor_auth || false,
        });
        
        setNotifications({
          email: true, // These are from notification_preferences table
          sms: true,
          push: false,
          licenseRenewal: true,
          paymentConfirmations: false,
          applicationStatus: true,
          systemAnnouncements: true,
          marketing: data.marketing_communications || false,
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = (section, key) => {
    switch (section) {
      case "notifications":
        setNotifications({ ...notifications, [key]: !notifications[key] });
        break;
      case "security":
        setSecurity({ ...security, [key]: !security[key] });
        break;
      case "payment":
        setPaymentSettings({ ...paymentSettings, [key]: !paymentSettings[key] });
        break;
      case "accessibility":
        setAccessibility({ ...accessibility, [key]: !accessibility[key] });
        break;
      case "privacy":
        setPrivacy({ ...privacy, [key]: !privacy[key] });
        break;
      default:
        break;
    }
  };

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    // Apply theme to document immediately
    if (selectedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (selectedTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      // Auto - could implement system preference detection
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
    // Save to localStorage for immediate persistence
    localStorage.setItem("vendor_theme", selectedTheme);
  };

  const handleSaveChanges = async () => {
    try {
      // Save all settings to backend
      await api.put("/vendor/settings", {
        theme,
        language,
        high_contrast_mode: accessibility.highContrast,
        large_text: accessibility.largeText,
        screen_reader_support: accessibility.screenReader,
        profile_visibility: privacy.profileVisibility,
        auto_renewal: paymentSettings.autoRenewal,
        save_payment_methods: paymentSettings.savePaymentMethods,
        email_receipts: paymentSettings.emailReceipts,
        two_factor_auth: security.twoFactor,
        marketing_communications: notifications.marketing,
      });
      
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Please try again.");
    }
  };

  const handleCancelChanges = () => {
    // Reset to original values
    alert("Changes cancelled");
  };

  const handleDeactivateAccount = async () => {
    if (confirm("Are you sure you want to deactivate your account? This action can be reversed.")) {
      try {
        await api.put("/vendor/deactivate-account");
        alert("Account deactivated successfully. You will be logged out.");
        localStorage.removeItem("hawker_token");
        localStorage.removeItem("hawker_user");
        window.location.href = "/login";
      } catch (err) {
        console.error("Failed to deactivate account:", err);
        alert("Failed to deactivate account. Please try again.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.")) {
      try {
        await api.delete("/vendor/delete-account");
        alert("Account deleted successfully. You will be logged out.");
        localStorage.removeItem("hawker_token");
        localStorage.removeItem("hawker_user");
        window.location.href = "/login";
      } catch (err) {
        console.error("Failed to delete account:", err);
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  const handleDownloadData = async () => {
    try {
      const res = await api.get("/vendor/download-data");
      const data = res.data;
      
      // Create a JSON file and download it
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("Your data has been downloaded successfully.");
    } catch (err) {
      console.error("Failed to download data:", err);
      alert("Failed to download data. Please try again.");
    }
  };

  const handleViewActivityLog = async () => {
    try {
      const res = await api.get("/vendor/activity-log");
      const activities = res.data.activities;
      
      // Display activities in a readable format
      const logText = activities.map(a => 
        `${a.type.toUpperCase()}: ${a.description} - ${new Date(a.updated_at || a.created_at).toLocaleString()}`
      ).join('\n');
      
      alert(`Recent Activity:\n\n${logText}`);
    } catch (err) {
      console.error("Failed to load activity log:", err);
      alert("Failed to load activity log. Please try again.");
    }
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Settings & Preferences"
        subtitle="Manage your account settings, notifications, and preferences"
        icon={FiSettings}
      />

      <div className="settings-page-container">

        {/* Main Grid Layout */}
        <div className="settings-grid">
          {/* Column 1 */}
          <div className="settings-column">
            {/* Appearance Card */}
            <div className="settings-card">
              <h3 className="card-title">Appearance</h3>
              
              <div className="setting-section">
                <label className="section-label">Theme Selection</label>
                <div className="theme-options">
                  <div 
                    className={`theme-option ${theme === "light" ? "selected" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <FiSun className="theme-icon" />
                    <span>Light</span>
                  </div>
                  <div 
                    className={`theme-option ${theme === "dark" ? "selected" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <FiMoon className="theme-icon" />
                    <span>Dark</span>
                  </div>
                  <div 
                    className={`theme-option ${theme === "auto" ? "selected" : ""}`}
                    onClick={() => handleThemeChange("auto")}
                  >
                    <FiMonitor className="theme-icon" />
                    <span>Auto</span>
                  </div>
                </div>
              </div>

              <div className="setting-section">
                <label className="section-label">Language Selection</label>
                <div className="language-options">
                  <div 
                    className={`language-option ${language === "bangla" ? "selected" : ""}`}
                    onClick={() => setLanguage("bangla")}
                  >
                    <span className="flag">🇧🇩</span>
                    <span>বাংলা</span>
                  </div>
                  <div 
                    className={`language-option ${language === "english" ? "selected" : ""}`}
                    onClick={() => setLanguage("english")}
                  >
                    <span className="flag">🇬🇧</span>
                    <span>English</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences Card */}
            <div className="settings-card">
              <h3 className="card-title">Notification Preferences</h3>
              <div className="notification-list">
                <div className="notification-item">
                  <span>Email Notifications</span>
                  <div 
                    className={`toggle-switch ${notifications.email ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "email")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>SMS Notifications</span>
                  <div 
                    className={`toggle-switch ${notifications.sms ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "sms")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Push Notifications</span>
                  <div 
                    className={`toggle-switch ${notifications.push ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "push")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>License Renewal Reminders</span>
                  <div 
                    className={`toggle-switch ${notifications.licenseRenewal ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "licenseRenewal")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Payment Confirmations</span>
                  <div 
                    className={`toggle-switch ${notifications.paymentConfirmations ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "paymentConfirmations")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Application Status Updates</span>
                  <div 
                    className={`toggle-switch ${notifications.applicationStatus ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "applicationStatus")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>System Announcements</span>
                  <div 
                    className={`toggle-switch ${notifications.systemAnnouncements ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "systemAnnouncements")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Marketing Communications</span>
                  <div 
                    className={`toggle-switch ${notifications.marketing ? "on" : "off"}`}
                    onClick={() => handleToggle("notifications", "marketing")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="settings-card">
              <h3 className="card-title">Security</h3>
              <div className="security-list">
                <div className="security-item">
                  <div className="security-info">
                    <FiShield className="security-icon" />
                    <span>Auto-Renewal</span>
                  </div>
                  <button className="action-btn">View/Edit Details</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiLock className="security-icon" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <button className="action-btn">{security.twoFactor ? "Disable 2FA" : "Enable 2FA"}</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiMonitor className="security-icon" />
                    <span>Active Sessions</span>
                  </div>
                  <button className="action-btn">View Sessions</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiSettings className="security-icon" />
                    <span>Login History</span>
                  </div>
                  <button className="action-btn">View History</button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="settings-column">
            {/* Payment & Renewal Card */}
            <div className="settings-card">
              <h3 className="card-title">Payment & Renewal</h3>
              <div className="notification-list">
                <div className="notification-item">
                  <span>Auto-Renewal</span>
                  <div 
                    className={`toggle-switch ${paymentSettings.autoRenewal ? "on" : "off"}`}
                    onClick={() => handleToggle("payment", "autoRenewal")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Save Payment Methods</span>
                  <div 
                    className={`toggle-switch ${paymentSettings.savePaymentMethods ? "on" : "off"}`}
                    onClick={() => handleToggle("payment", "savePaymentMethods")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Email Receipts</span>
                  <div 
                    className={`toggle-switch ${paymentSettings.emailReceipts ? "on" : "off"}`}
                    onClick={() => handleToggle("payment", "emailReceipts")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility Card */}
            <div className="settings-card">
              <h3 className="card-title">Accessibility</h3>
              <div className="notification-list">
                <div className="notification-item">
                  <span>High Contrast Mode</span>
                  <div 
                    className={`toggle-switch ${accessibility.highContrast ? "on" : "off"}`}
                    onClick={() => handleToggle("accessibility", "highContrast")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Large Text</span>
                  <div 
                    className={`toggle-switch ${accessibility.largeText ? "on" : "off"}`}
                    onClick={() => handleToggle("accessibility", "largeText")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
                <div className="notification-item">
                  <span>Screen Reader Support</span>
                  <div 
                    className={`toggle-switch ${accessibility.screenReader ? "on" : "off"}`}
                    onClick={() => handleToggle("accessibility", "screenReader")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Data Card */}
            <div className="settings-card">
              <h3 className="card-title">Privacy & Data</h3>
              <div className="security-list">
                <div className="security-item">
                  <div className="security-info">
                    <FiDownload className="security-icon" />
                    <span>Download Your Data</span>
                  </div>
                  <button className="action-btn" onClick={handleDownloadData}>Download</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiSettings className="security-icon" />
                    <span>Activity Log</span>
                  </div>
                  <button className="action-btn" onClick={handleViewActivityLog}>View Log</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiGlobe className="security-icon" />
                    <span>Data Sharing Preferences</span>
                  </div>
                  <button className="action-btn">Manage</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiShield className="security-icon" />
                    <span>Profile Visibility</span>
                  </div>
                  <div 
                    className={`toggle-switch ${privacy.profileVisibility ? "on" : "off"}`}
                    onClick={() => handleToggle("privacy", "profileVisibility")}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Actions */}
        <div className="settings-actions">
          <button className="cancel-btn" onClick={handleCancelChanges}>
            Cancel Changes
          </button>
          <button className="save-btn" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>

        {/* Danger Zone Card */}
        <div className="danger-zone-card">
          <div className="danger-zone-content">
            <div className="danger-zone-warning">
              <FiAlertTriangle className="danger-icon" />
              <div className="danger-text">
                <strong>Danger Zone:</strong> These actions are permanent and cannot be undone. Please proceed with caution.
              </div>
            </div>
            <div className="danger-zone-actions">
              <button className="danger-btn deactivate-btn" onClick={handleDeactivateAccount}>
                Deactivate Account
              </button>
              <button className="danger-btn delete-btn" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
