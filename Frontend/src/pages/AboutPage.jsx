import { FiLayers, FiPhoneCall } from "react-icons/fi";
import PageTitle from "../components/common/PageTitle";

export default function AboutPage() {
  return (
    <main className="public-page">
      <section className="public-hero compact">
        <div className="container py-5 text-center">
          <h1>About The System</h1>
          <p>
            Learn how we are transforming urban vending through digital
            governance.
          </p>
        </div>
      </section>

      <section className="container py-4">
        <div className="panel-box">
          <PageTitle
            title="System Overview"
            subtitle="Designed for transparent city operations"
            icon={FiLayers}
          />
          <p>
            Hawker is a smart licensing platform that digitizes registration,
            document verification, zoning, approvals, renewals, and compliance
            tracking for urban street vendors. It reduces manual delays and
            improves transparency for both vendors and authorities.
          </p>
          <div className="overview-flow mt-4">
            <div>Register</div>
            <span>→</span>
            <div>Verify</div>
            <span>→</span>
            <div>Apply</div>
            <span>→</span>
            <div>Review</div>
            <span>→</span>
            <div>Digital License</div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="panel-box h-100">
              <h4 className="section-title-sm">Our Mission</h4>
              <p>
                To ensure every street vendor can access licensing services with
                dignity, speed, and fairness while enabling city authorities to
                regulate zones effectively.
              </p>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="panel-box h-100">
              <h4 className="section-title-sm">Our Vision</h4>
              <p>
                To build inclusive digital public infrastructure for vending
                ecosystems, driving better livelihoods, cleaner urban spaces,
                and accountable governance.
              </p>
            </div>
          </div>
        </div>

        <div className="panel-box mt-4">
          <PageTitle
            title="Authority & Contact"
            subtitle="Need help? Reach the municipal support desk"
            icon={FiPhoneCall}
          />
          <div className="row g-3">
            <div className="col-md-3">
              <strong>Municipal Office</strong>
              <p className="mb-0">Gulshan 02, Dhaka</p>
            </div>
            <div className="col-md-3">
              <strong>Email</strong>
              <p className="mb-0">support@streetvendorsystem.gov</p>
            </div>
            <div className="col-md-3">
              <strong>Phone</strong>
              <p className="mb-0">01775234795</p>
            </div>
            <div className="col-md-3">
              <strong>Working Hours</strong>
              <p className="mb-0">Sun-Thus, 9 AM - 6 PM</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
