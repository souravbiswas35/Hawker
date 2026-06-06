import { Link } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";
import { FiArrowRight, FiShield, FiTrendingUp } from "react-icons/fi";
import "../styles/pages/LandingPage.css";

const benefitCards = [
  { icon: "bi-eye", label: "Transparency" },
  { icon: "bi-lightning-charge", label: "Fast Process" },
  { icon: "bi-diagram-3", label: "Fair Allocation" },
  { icon: "bi-speedometer2", label: "Easy Monitoring" },
];

const highlights = [
  {
    icon: "bi-file-earmark-lock",
    text: "Digital documentation and secure records",
  },
  { icon: "bi-bell", text: "Automated status and renewal notifications" },
  { icon: "bi-geo-alt", text: "Zone mapping and occupancy intelligence" },
  { icon: "bi-qr-code", text: "QR-enabled digital license issuance" },
  { icon: "bi-chat-dots", text: "Complaint and grievance tracking" },
  { icon: "bi-clipboard2-check", text: "Inspection and compliance workflows" },
];

export default function LandingPage() {
  return (
    <main className="public-page">
      <section className="landing-hero">
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <span className="hero-pill">
                <FiTrendingUp /> Urban Vending Digital Platform
              </span>
              <h1 className="display-4" style={{ color: "#000" }}>
                Streamlining urban vending for a better tomorrow
              </h1>
              <p className="lead mt-3" style={{ color: "#000" }}>
                Modern digital governance for vendor licensing, approvals, and
                city-level monitoring.
              </p>
            </div>
          </div>

          <div className="row g-3 mt-3">
            {benefitCards.map((item) => (
              <div className="col-md-3 col-6" key={item.label}>
                <div className="benefit-card">
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-4 ">
        
        <div className="panel-box">
          <PageTitle
            title="Feature Highlights"
            subtitle="Fast, transparent, and secure digital licensing capabilities"
            icon={FiShield}
            className="text-center page-title-center"
          />
          <div className="row g-3 mt-1">
            {highlights.map((item) => (
              <div className="col-md-4" key={item.text}>
                <div className="highlight-item">
                  <i className={`bi ${item.icon}`} />
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-2">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="metric-card">
              <span>Vendors Registered</span>
              <h3>11,546</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <span>Licenses Issued</span>
              <h3>8,824</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="metric-card">
              <span>Active Zones</span>
              <h3>156</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-4">
        <h2 className="section-title text-center">How It Works</h2>
        <p className="text-center text-muted">Get licensed in 3 simple steps</p>
        <div className="row g-3 mt-1">
          <div className="col-md-4">
            <div className="process-card">
              <h5>1. Register & Apply</h5>
              <p>
                Create your account, upload documents, and submit application.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="process-card">
              <h5>2. Verification & Approval</h5>
              <p>
                Authority verifies details and reviews your request
                transparently.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="process-card">
              <h5>3. Get Your License</h5>
              <p>
                Receive your digital QR-coded license for your allocated zone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-4">
        <div className="cta-banner text-center">
          <h3 className="mb-2">Ready to Get Started?</h3>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Link to="/register" className="btn btn-warning px-4">
              Register as Vendor
            </Link>
            <Link to="/login" className="btn btn-light px-4">
              Admin Login <FiArrowRight className="ms-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
