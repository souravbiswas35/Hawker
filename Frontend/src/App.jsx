import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppNavbar from "./components/layout/AppNavbar";
import PublicFooter from "./components/layout/PublicFooter";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";
import ZonesPage from "./pages/ZonesPage";
import FaqPage from "./pages/FaqPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";
import VendorProfilePage from "./pages/vendor/VendorProfilePage";
import VendorDocumentsPage from "./pages/vendor/VendorDocumentsPage";
import VendorApplyPage from "./pages/vendor/VendorApplyPage";
import VendorApplicationsPage from "./pages/vendor/VendorApplicationsPage";
import VendorComplaintsPage from "./pages/vendor/VendorComplaintsPage";
import VendorComplaintTrackingPage from "./pages/vendor/VendorComplaintTrackingPage";
import VendorNotificationsPage from "./pages/vendor/VendorNotificationsPage";
import TrackLicenseApplicationPage from "./pages/vendor/TrackLicenseApplicationPage";
import VendorRenewLicensePage from "./pages/vendor/VendorRenewLicensePage";
import VendorRenewalSuccessPage from "./pages/vendor/VendorRenewalSuccessPage";
import VendorMyLicensePage from "./pages/vendor/VendorMyLicensePage";
import VendorMyZonePage from "./pages/vendor/VendorMyZonePage";
import VendorPaymentsPage from "./pages/vendor/VendorPaymentsPage";
import VendorMakePaymentPage from "./pages/vendor/VendorMakePaymentPage";
import VendorPaymentHistoryPage from "./pages/vendor/VendorPaymentHistoryPage";
import VendorSettingsPage from "./pages/vendor/VendorSettingsPage";
import VendorInspectionHistoryPage from "./pages/vendor/VendorInspectionHistoryPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminComplaintsPage from "./pages/admin/AdminComplaintsPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminInspectionsPage from "./pages/admin/AdminInspectionsPage";
import AdminCompliancePage from "./pages/admin/AdminCompliancePage";
import AdminZonesPage from "./pages/admin/AdminZonesPage";
import AdminZoneCreatePage from "./pages/admin/AdminZoneCreatePage";

function PageTransition({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return <div className="page-transition-wrapper">{children}</div>;
}

export default function App() {
  return (
    <div className="app-bg min-vh-100">
      <AppNavbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/documents"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/apply"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorApplyPage />
              </ProtectedRoute>
            }
          />
          <Route path="/vendor/apply-test" element={<VendorApplyPage />} />
          <Route
            path="/vendor/applications"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/renew-license"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorRenewLicensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/my-license"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorMyLicensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/my-zone"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorMyZonePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor/notifications"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorNotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor/renew-license/success"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorRenewalSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor/complaints"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/complaint-tracking"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorComplaintTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/track/:applicationId"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <TrackLicenseApplicationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/payments"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/payments/make"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorMakePaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/payments/history"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorPaymentHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/settings"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/inspection-history"
            element={
              <ProtectedRoute roles={["vendor"]}>
                <VendorInspectionHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminVendorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inspections"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminInspectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/compliance"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminCompliancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/zones-management"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminZonesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/zones-management/new"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminZoneCreatePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      <PublicFooter />
    </div>
  );
}
