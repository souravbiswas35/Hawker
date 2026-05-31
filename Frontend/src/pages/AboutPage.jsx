import {
  FiLayers,
  FiPhoneCall,
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiMapPin,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import PageTitle from "../components/common/PageTitle";
import "../styles/pages/AboutPage.css";

const keyObjectives = [
  {
    icon: FiShield,
    title: "Secure licensing flow",
    text: "Protect vendor records and reduce manual handling through a verified digital process.",
  },
  {
    icon: FiTrendingUp,
    title: "Faster approvals",
    text: "Move applications from submission to review with fewer delays and better tracking.",
  },
  {
    icon: FiMapPin,
    title: "Smarter zone allocation",
    text: "Help authorities assign vending spaces based on capacity, location, and compliance rules.",
  },
  {
    icon: FiCheckCircle,
    title: "Transparent records",
    text: "Keep every application, review, and license update searchable and easy to audit.",
  },
];

const benefits = [
  {
    icon: FiUsers,
    title: "For Vendors",
    text: "Reduced paperwork, quicker approvals, clear renewal history, and digital access to license status.",
  },
  {
    icon: FiShield,
    title: "For Authorities",
    text: "Better case management, compliance monitoring, and a reliable record of decisions and actions.",
  },
  {
    icon: FiMapPin,
    title: "For Cities",
    text: "Organized vending spaces, cleaner public areas, and more data-driven urban management.",
  },
  {
    icon: FiCheckCircle,
    title: "For Citizens",
    text: "Safer streets, more predictable vending locations, and improved local service quality.",
  },
];

export default function AboutPage() {
  return (
    <main className="public-page">
      <section className="public-hero about-hero compact">
        <div className="container py-5 text-center">
          <span className="hero-pill">
            <FiLayers /> About The System
          </span>
          <h1 className="display-5 mb-3">
            Digital governance for urban vending
          </h1>
          <p className="lead mb-0 about-hero-text">
            Hawker turns a traditionally manual process into a modern,
            traceable, and more equitable licensing experience for vendors and
            authorities.
          </p>
        </div>
      </section>

      <section className="container py-4">
        <div className="panel-box about-intro-box">
          <PageTitle
            title="System Overview"
            subtitle="Designed for transparent city operations"
            icon={FiLayers}
          />
          <div className="row g-4 align-items-center mt-1">
            <div className="col-lg-7">
              <p className="about-copy mb-3">
                Hawker is a smart licensing platform that digitizes
                registration, document verification, zoning, approvals,
                renewals, and compliance tracking for urban street vendors. It
                reduces delays, improves transparency, and gives both vendors
                and authorities a clear view of every step in the process.
              </p>
              <div className="overview-flow about-flow mt-4">
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
            <div className="col-lg-5">
              <div className="about-summary-card">
                <div className="about-summary-item">
                  <FiClock />
                  <div>
                    <strong>Faster processing</strong>
                    <p>Reduce manual steps and track progress in one place.</p>
                  </div>
                </div>
                <div className="about-summary-item">
                  <FiShield />
                  <div>
                    <strong>Safer records</strong>
                    <p>Every action is preserved for audit and review.</p>
                  </div>
                </div>
                <div className="about-summary-item">
                  <FiUsers />
                  <div>
                    <strong>Inclusive access</strong>
                    <p>Designed to make licensing simpler for all vendors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="panel-box about-card h-100">
              <h4 className="section-title-sm">Our Mission</h4>
              <p>
                To ensure every street vendor can access licensing services with
                dignity, speed, and fairness while enabling city authorities to
                regulate zones effectively.
              </p>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="panel-box about-card h-100">
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
            title="Key Objectives"
            subtitle="The platform is built to improve licensing, oversight, and city coordination"
            icon={FiCheckCircle}
          />
          <div className="row g-3 mt-1">
            {keyObjectives.map((item) => {
              const Icon = item.icon;
              return (
                <div className="col-md-6 col-lg-3" key={item.title}>
                  <div className="about-feature-card">
                    <div className="about-feature-icon">
                      <Icon />
                    </div>
                    <h6 className="mb-2">{item.title}</h6>
                    <p className="mb-0">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel-box mt-4">
          <PageTitle
            title="Benefits of the System"
            subtitle="The platform creates value for every stakeholder involved in urban vending"
            icon={FiTrendingUp}
          />
          <div className="row g-3 mt-1">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div className="col-md-6" key={item.title}>
                  <div className="about-benefit-card">
                    <div className="about-benefit-head">
                      <div className="about-benefit-icon">
                        <Icon />
                      </div>
                      <strong>{item.title}</strong>
                    </div>
                    <p className="mb-0">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel-box mt-4">
          <PageTitle
            title="Authority & Contact"
            subtitle="Need help? Reach the municipal support desk"
            icon={FiPhoneCall}
          />
          <div className="row g-3 mt-1">
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
              <p className="mb-0">Sun-Thu, 9 AM - 6 PM</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
