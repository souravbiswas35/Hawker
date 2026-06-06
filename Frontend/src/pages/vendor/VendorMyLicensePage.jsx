import { useEffect, useState, useRef } from "react";
import {
  FiCreditCard,
  FiDownload,
  FiPrinter,
  FiShare2,
  FiAlertTriangle,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiShield,
  FiX,
  FiEye,
} from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorMyLicensePage.css";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VendorMyLicensePage() {
  const [data, setData] = useState(null);
  const licenseCardRef = useRef(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    async function loadLicense() {
      try {
        const res = await api.get("/vendor/my-license");
        setData(res.data);
        
        // Load profile picture from database if available
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
        setError(
          err.response?.data?.message ||
            "Failed to load license. Please apply for a license first.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadLicense();
  }, []);

  const handleDownloadPDF = () => {
    if (!data?.license || !data?.profile) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFillColor(31, 122, 159);
    pdf.rect(0, 0, pageWidth, 40, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("Digital Vendor License", pageWidth / 2, 25, { align: "center" });

    yPosition = 55;

    // Vendor Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Vendor Information", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const vendorInfo = [
      { label: "Name", value: `${data.profile.first_name || ""} ${data.profile.last_name || ""}`.trim() || data.profile.business_name || "N/A" },
      { label: "Business Name", value: data.profile.business_name || "N/A" },
      { label: "Phone", value: data.profile.phone || "N/A" },
      { label: "Address", value: data.profile.address || "N/A" },
    ];

    vendorInfo.forEach((item) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${item.label}:`, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(item.value, 60, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // License Details
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("License Details", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const licenseInfo = [
      { label: "License Number", value: data.license.license_number || "N/A" },
      { label: "Application Reference", value: data.license.application_ref || "N/A" },
      { label: "License Type", value: data.license.license_type_name || data.license.stall_type || data.license.license_category || "N/A" },
      { label: "Category", value: data.license.license_category || "General" },
      { label: "Allocated Zone", value: data.license.desired_zone || data.profile.vending_zone || "N/A" },
      { label: "Goods Authorized", value: data.license.goods_authorized || data.license.business_category || "N/A" },
      { label: "Issued Date", value: formatDate(data.license.issued_at) },
      { label: "Expiry Date", value: formatDate(data.license.expires_at) },
      { label: "Status", value: "Active" },
    ];

    licenseInfo.forEach((item) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${item.label}:`, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(item.value, 70, yPosition);
      yPosition += 8;
    });

    yPosition += 15;

    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Issued by: Hawker Management Authority", 20, yPosition);
    pdf.text(`This document is valid until ${formatDate(data.license.expires_at)}`, 20, yPosition + 6);

    pdf.save(`vendor-license-${data.license.license_number || "license"}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: "My Vendor License",
      text: `License Number: ${data?.license?.license_number}\nVendor: ${data?.profile?.first_name} ${data?.profile?.last_name}\nValid until: ${formatDate(data?.license?.expires_at)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share failed:", err);
        // Fallback to clipboard
        handleCopyToClipboard();
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = () => {
    const text = `License Number: ${data?.license?.license_number}\nVendor: ${data?.profile?.first_name} ${data?.profile?.last_name}\nValid until: ${formatDate(data?.license?.expires_at)}`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert("License details copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy license details");
    });
  };

  const handleReportLost = () => {
    const licenseNumber = data?.license?.license_number;
    const message = `Report Lost/Damaged License\n\nLicense Number: ${licenseNumber}\n\nPlease contact the Hawker Management Authority immediately to report your lost or damaged license.\n\nContact: support@hawker.gov.bd\nPhone: +880 1XXX-XXXXXX`;
    
    if (confirm(message)) {
      // Navigate to complaints page or show a form
      window.location.href = "/vendor/complaints";
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <LoadingState label="Loading your license..." />
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <PageTitle
          title="My License"
          subtitle="View and manage your digital vendor license"
          icon={FiCreditCard}
          className="mb-4"
        />
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <FiAlertTriangle /> {error}
        </div>
      </VendorLayout>
    );
  }

  const { profile, license } = data;
  const vendorName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.business_name || "Vendor Name";

  return (
    <VendorLayout>
      <PageTitle
        title="My License"
        subtitle="View and manage your digital vendor license"
        icon={FiCreditCard}
        className="mb-4"
      />

      <div className="license-page-container">
        {/* Digital License Card */}
        <div className="license-card-wrapper">
          <div className="digital-license-card" id="license-card" ref={licenseCardRef}>
            {/* Card Header */}
            <div className="license-card-header">
              <div className="license-card-title">
                <FiShield className="license-icon" />
                <h3>Digital Vendor License</h3>
              </div>
              <div className="license-badge">Official</div>
            </div>

            {/* Vendor Info Section */}
            <div className="license-vendor-section">
              <div className="vendor-photo-wrapper">
                {profilePictureUrl ? (
                  <>
                    <img
                      src={profilePictureUrl}
                      alt="Vendor Photo"
                      className="vendor-photo"
                      onLoad={(e) => {
                        console.log('Profile picture loaded successfully');
                        e.target.style.display = 'block';
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) placeholder.style.display = 'none';
                      }}
                      onError={(e) => {
                        console.error('Profile picture failed to load:', profilePictureUrl);
                        e.target.style.display = 'none';
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                      style={{ display: 'none' }}
                    />
                    <div className="vendor-photo-placeholder" style={{ display: 'flex' }}>
                      <FiCreditCard size={32} />
                    </div>
                  </>
                ) : (
                  <div className="vendor-photo-placeholder" style={{ display: 'flex' }}>
                    <FiCreditCard size={32} />
                  </div>
                )}
              </div>
              <div className="vendor-info">
                <h4 className="vendor-name">{vendorName}</h4>
                <p className="vendor-business">{profile?.business_name || ""}</p>
              </div>
            </div>

            {/* License Details Grid */}
            <div className="license-details-grid">
              <div className="license-detail-item">
                <div className="detail-label">
                  <FiCreditCard /> License Number
                </div>
                <div className="detail-value license-number">
                  {license?.license_number || "N/A"}
                </div>
              </div>

              <div className="license-detail-item">
                <div className="detail-label">
                  <FiCalendar /> Validity Period
                </div>
                <div className="detail-value">
                  {formatDate(license?.issued_at)} - {formatDate(license?.expires_at)}
                </div>
              </div>

              <div className="license-detail-item">
                <div className="detail-label">
                  <FiMapPin /> Allocated Zone
                </div>
                <div className="detail-value">
                  {license?.desired_zone || profile?.vending_zone || "N/A"}
                </div>
              </div>

              <div className="license-detail-item">
                <div className="detail-label">
                  <FiPackage /> Goods Authorized
                </div>
                <div className="detail-value">
                  {license?.goods_authorized || license?.business_category || "N/A"}
                </div>
              </div>

              <div className="license-detail-item">
                <div className="detail-label">
                  <FiShield /> License Type
                </div>
                <div className="detail-value">
                  {license?.license_type_name || license?.stall_type || license?.license_category || "N/A"}
                </div>
              </div>

              <div className="license-detail-item">
                <div className="detail-label">
                  <FiCreditCard /> Category
                </div>
                <div className="detail-value">
                  {license?.license_category || "General"}
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="license-qr-section">
              <div className="qr-code-wrapper">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `LICENSE:${license?.license_number || "PENDING"}|VENDOR:${vendorName}|BUSINESS:${profile?.business_name || "N/A"}|ZONE:${license?.desired_zone || profile?.vending_zone || "N/A"}|VALID:${formatDate(license?.expires_at)}|ISSUED:Hawker Management Authority`
                  )}`}
                  alt="License QR Code"
                  className="qr-code-image"
                />
              </div>
              <div className="qr-info">
                <p className="qr-label">Scan to Verify</p>
                <p className="qr-sublabel">Scan QR code to view complete vendor license information</p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="license-card-footer">
              <div className="footer-info">
                <span>Issued by: Hawker Management Authority</span>
                <span>|</span>
                <span>Ref: {license?.application_ref || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="license-actions">
          <button className="action-btn download-btn" onClick={handleDownloadPDF}>
            <FiDownload />
            <span>Download as PDF</span>
          </button>
          <button className="action-btn print-btn" onClick={handlePrint}>
            <FiPrinter />
            <span>Print</span>
          </button>
          <button className="action-btn share-btn" onClick={handleShare}>
            <FiShare2 />
            <span>Share Digitally</span>
          </button>
          <button className="action-btn report-btn" onClick={handleReportLost}>
            <FiAlertTriangle />
            <span>Report Lost/Damaged</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="license-info-card">
          <h5 className="info-card-title">License Information</h5>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value status-active">Active</span>
            </div>
            <div className="info-item">
              <span className="info-label">Issued Date</span>
              <span className="info-value">{formatDate(license?.issued_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Expiry Date</span>
              <span className="info-value">{formatDate(license?.expires_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Application Ref</span>
              <span className="info-value">{license?.application_ref || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* View Full Details Button */}
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary px-4 py-2 rounded-pill"
            onClick={() => setShowDetailsModal(true)}
          >
            <FiEye className="me-2" />
            View Full License Details
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="license-details-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="license-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Complete License Information</h4>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h5>Vendor Information</h5>
                <ul className="details-list">
                  <li>
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile?.business_name || "N/A"}
                    </span>
                  </li>
                  <li>
                    <span className="detail-label">Business Name:</span>
                    <span className="detail-value">{profile?.business_name || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{profile?.phone || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{profile?.address || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Business Type:</span>
                    <span className="detail-value">{profile?.business_type || "N/A"}</span>
                  </li>
                </ul>
              </div>

              <div className="details-section">
                <h5>License Details</h5>
                <ul className="details-list">
                  <li>
                    <span className="detail-label">License Number:</span>
                    <span className="detail-value license-number-highlight">
                      {license?.license_number || "N/A"}
                    </span>
                  </li>
                  <li>
                    <span className="detail-label">Application Reference:</span>
                    <span className="detail-value">{license?.application_ref || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">License Type:</span>
                    <span className="detail-value">{license?.license_type_name || license?.stall_type || license?.license_category || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{license?.license_category || "General"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Allocated Zone:</span>
                    <span className="detail-value">{license?.desired_zone || profile?.vending_zone || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Goods Authorized:</span>
                    <span className="detail-value">{license?.goods_authorized || license?.business_category || "N/A"}</span>
                  </li>
                  <li>
                    <span className="detail-label">Issued Date:</span>
                    <span className="detail-value">{formatDate(license?.issued_at)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Expiry Date:</span>
                    <span className="detail-value">{formatDate(license?.expires_at)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Status:</span>
                    <span className="detail-value status-active">Active</span>
                  </li>
                </ul>
              </div>

              <div className="details-section">
                <h5>Issuing Authority</h5>
                <ul className="details-list">
                  <li>
                    <span className="detail-label">Issued By:</span>
                    <span className="detail-value">Hawker Management Authority</span>
                  </li>
                  <li>
                    <span className="detail-label">Valid Until:</span>
                    <span className="detail-value">{formatDate(license?.expires_at)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
