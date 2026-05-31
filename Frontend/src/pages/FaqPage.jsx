import { useMemo, useState } from "react";
import {
  FiDownload,
  FiHelpCircle,
  FiLifeBuoy,
  FiPlayCircle,
} from "react-icons/fi";
import PageTitle from "../components/common/PageTitle";
import "../styles/pages/FaqPage.css";

const faqs = [
  {
    q: "How do I register as a new vendor?",
    a: "Create an account using email and password, verify your email code, then complete your profile.",
    cat: "Registration",
  },
  {
    q: "What documents are required for license application?",
    a: "National ID copy, trade license, and profile photo are required in most cases.",
    cat: "Licensing",
  },
  {
    q: "How long does it take to get license approval?",
    a: "Typical approval takes 3-5 working days after all documents are verified.",
    cat: "Licensing",
  },
  {
    q: "How can I pay license fees?",
    a: "You can use integrated online payment channels and track receipts from your dashboard.",
    cat: "Payments",
  },
  {
    q: "How do I renew my license?",
    a: "Open your application history and submit renewal request before expiry.",
    cat: "Renewals",
  },
  {
    q: "How do I file a complaint?",
    a: "Go to complaint section, describe the issue, and upload supporting evidence.",
    cat: "Complaints",
  },
  {
    q: "Can I track my application status?",
    a: "Yes, each application has real-time status: submitted, under review, approved, or rejected.",
    cat: "Licensing",
  },
];

const categories = [
  "All",
  "Registration",
  "Licensing",
  "Payments",
  "Renewals",
  "Complaints",
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = useMemo(
    () =>
      faqs.filter((item) => {
        const byCat = activeCat === "All" || item.cat === activeCat;
        const needle = query.toLowerCase();
        const byText =
          item.q.toLowerCase().includes(needle) ||
          item.a.toLowerCase().includes(needle);
        return byCat && byText;
      }),
    [query, activeCat],
  );

  return (
    <main className="public-page">
      <section className="public-hero compact">
        <div className="container py-5 text-center">
          <h1>Help Center & FAQs</h1>
          <p>Find answers to your questions and get the support you need.</p>
          <div className="faq-search mx-auto mt-3">
            <input
              className="form-control"
              placeholder="Search help articles, tutorials, FAQs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="container py-4">
        <div className="panel-box">
          <PageTitle
            title="Frequently Asked Questions"
            subtitle="Filter by category and quickly find answers"
            icon={FiHelpCircle}
          />
          <div className="d-flex flex-wrap gap-2 mb-3 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${activeCat === cat ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="faq-list">
            {filtered.map((item, idx) => (
              <details className="faq-item" key={item.q} open={idx === 0}>
                <summary>{item.q}</summary>
                <p className="mb-0 mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="panel-box gap-2 mb-3 mt-4">
          <PageTitle
            title="Video Tutorials"
            subtitle="Bite-sized walkthroughs for common workflows"
            icon={FiPlayCircle}
          />
          <div className="row g-3 mt-4">
            {[
              "How to Register",
              "Apply for License",
              "Online Payment",
              "License Renewal",
              "Track Complaints",
              "Using Digital License",
            ].map((title) => (
              <div className="col-lg-4 col-md-6" key={title}>
                <div className="video-item">
                  <div className="video-thumb">
                    <i className="bi bi-camera-video-fill" />
                  </div>
                  <div className="p-3">
                    <h6 className="mb-1">{title}</h6>
                    <small className="text-muted">Tutorial • 3-7 mins</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-box mt-4 live-help-wrap gap-2 mb-3">
          <PageTitle
            title="Still Need Help?"
            subtitle="Our support team is here to assist you"
            icon={FiLifeBuoy}
            className="title-light"
          />
          <p className="text-white-50">
            Choose your preferred support channel.
          </p>
          <div className="row g-3 mt-1">
            <div className="col-md-4">
              <div className="support-card">
                <h6>Live Chat</h6>
                <p>Chat with support in real-time</p>
                <button className="btn btn-sm btn-primary">Start Chat</button>
              </div>
            </div>
            <div className="col-md-4">
              <div className="support-card">
                <h6>Email Support</h6>
                <p>Response within 24 hours</p>
                <button className="btn btn-sm btn-primary">Send Email</button>
              </div>
            </div>
            <div className="col-md-4">
              <div className="support-card">
                <h6>Phone Support</h6>
                <p>Call helpline: 01775234795</p>
                <button className="btn btn-sm btn-primary">Call Now</button>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-box mt-4 gap-2 mb-3">
          <PageTitle
            title="Download Resources"
            subtitle="Guides, checklists, and templates for vendors"
            icon={FiDownload}
          />
          <div className="row g-2 mt-4">
            {[
              "User Manual (PDF)",
              "Application Checklist",
              "Fee Structure",
              "Vending Regulations",
              "Mobile App Guide",
              "Sample Form",
            ].map((doc) => (
              <div className="col-md-4" key={doc}>
                <div className="download-row">
                  <span>{doc}</span>
                  <button className="btn btn-sm btn-outline-primary">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
