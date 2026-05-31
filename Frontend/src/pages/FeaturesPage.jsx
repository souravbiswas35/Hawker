import { FiPlayCircle, FiStar } from "react-icons/fi";
import PageTitle from "../components/common/PageTitle";
import "../styles/pages/FeaturesPage.css";

const features = [
  {
    title: "Vendor Registration & Profile",
    icon: "bi-person-vcard",
    desc: "Easy onboarding with digital identity capture and profile maintenance.",
  },
  {
    title: "License Application & Approval",
    icon: "bi-file-earmark-check",
    desc: "Structured application flow with transparent status and review steps.",
  },
  {
    title: "Digital License Issuance",
    icon: "bi-qr-code",
    desc: "Generate and validate QR-based digital licenses securely.",
  },
  {
    title: "License Renewal",
    icon: "bi-arrow-repeat",
    desc: "Timely reminders and smooth online renewal workflow.",
  },
  {
    title: "Zone Management",
    icon: "bi-geo-alt",
    desc: "Map-based zone allocation and occupancy control.",
  },
  {
    title: "Payment Management",
    icon: "bi-credit-card",
    desc: "Track fees, receipts, and payment records in one place.",
  },
  {
    title: "Complaint Management",
    icon: "bi-chat-square-text",
    desc: "Submit and monitor grievances with evidence and timeline updates.",
  },
  {
    title: "Notifications",
    icon: "bi-bell",
    desc: "Real-time alerts via in-app/email/SMS notification channels.",
  },
  {
    title: "Inspection & Compliance",
    icon: "bi-clipboard2-check",
    desc: "Inspection planning and compliance records for city monitoring.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="public-page">
      <section className="public-hero compact">
        <div className="container py-5 text-center">
          <h1>Comprehensive Features</h1>
          <p>
            Everything you need for efficient vendor licensing and city
            management.
          </p>
        </div>
      </section>

      <section className="container py-4">
        <PageTitle
          title="Platform Capabilities"
          subtitle="Nine core modules powering street vendor licensing"
          icon={FiStar}
          className="mb-3"
        />
        <div className="row g-4">
          {features.map((item) => (
            <div className="col-lg-4 col-md-6" key={item.title}>
              <div className="feature-card-modern h-100">
                <i className={`bi ${item.icon}`} />
                <h5>{item.title}</h5>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="panel-box mt-4">
          <PageTitle
            title="Interactive Demos & Videos"
            subtitle="Learn each module through short guided walkthroughs"
            icon={FiPlayCircle}
          />
          <div className="row g-3">
            {features.map((item, idx) => (
              <div className="col-lg-4 col-md-6" key={`${item.title}-video`}>
                <div className="video-item">
                  <div className="video-thumb">
                    <i className="bi bi-play-circle-fill" />
                  </div>
                  <div className="p-3">
                    <h6 className="mb-1">{item.title}</h6>
                    <small className="text-muted">
                      Demo tutorial {idx + 1} • 4-{7 + (idx % 3)} mins
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
