import { useEffect, useMemo, useState } from "react";
import { FiClock, FiCreditCard, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorRenewLicensePage.css";

const PERIOD_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "1 year" },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VendorRenewLicensePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [licenseData, setLicenseData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [quote, setQuote] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(false);
  const [savingAutoRenew, setSavingAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentLicense = licenseData?.currentLicense || null;
  const paymentOptions = licenseData?.paymentOptions || [];

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const res = await api.get("/vendor/license-renewal");
        setLicenseData(res.data);

        const defaultPeriod = res.data?.quotes?.[0]?.periodMonths || 1;
        setSelectedPeriod(defaultPeriod);
        setQuote(
          res.data?.quotes?.find(
            (item) => item.periodMonths === defaultPeriod,
          ) || null,
        );
        setPaymentMethod(res.data?.paymentOptions?.[0]?.value || "");
        setAutoRenewEnabled(
          Boolean(res.data?.currentLicense?.autoRenewEnabled),
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load renewal details",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, []);

  const expiryBadgeClass = useMemo(() => {
    if (!currentLicense) return "bg-secondary";
    if (currentLicense.isExpired) return "bg-danger";
    if (currentLicense.isExpiringSoon) return "bg-warning text-dark";
    return "bg-success";
  }, [currentLicense]);

  async function refreshQuote(periodMonths) {
    try {
      setError("");
      const cachedQuote = licenseData?.quotes?.find(
        (item) => item.periodMonths === periodMonths,
      );
      if (cachedQuote) {
        setQuote(cachedQuote);
        return;
      }

      const res = await api.post("/vendor/license-renewal/quote", {
        periodMonths,
      });
      setQuote(res.data.quote);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to calculate renewal fee",
      );
    }
  }

  async function handleSaveAutoRenew() {
    try {
      setSavingAutoRenew(true);
      setError("");
      setMessage("");
      const res = await api.patch("/vendor/license-renewal/auto-renew", {
        enableAutoRenew: autoRenewEnabled,
      });
      setMessage(res.data?.message || "Auto-renewal updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update auto-renewal");
    } finally {
      setSavingAutoRenew(false);
    }
  }

  async function handleSubmitRenewal(e) {
    e.preventDefault();

    if (!quote) {
      setError("Renewal quote is not available yet");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("periodMonths", String(selectedPeriod));
      formData.append("paymentMethod", paymentMethod);
      formData.append("enableAutoRenew", String(autoRenewEnabled));
      formData.append("notes", notes);

      const res = await api.post("/vendor/license-renewal/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/vendor/renew-license/success", {
        state: {
          renewalRef: res.data?.renewal?.renewalRef,
          renewedUntil: res.data?.renewal?.renewedUntil,
          paymentMethod: res.data?.renewal?.paymentMethod,
          payableAmount: res.data?.renewal?.payableAmount,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit renewal request",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VendorLayout>
      <PageTitle
        title="Renew License"
        subtitle="Choose period and payment option to renew instantly using a demo payment flow."
        icon={FiRefreshCw}
        className="mb-4"
      />

      <div className="mb-3">
        <span className="badge text-bg-warning">Demo Payment Mode</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <LoadingState label="Loading renewal information..." />
      ) : !currentLicense ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="card-body p-4">
            <h5>No renewable license found</h5>
            <p className="text-muted mb-0">
              Submit and get approval for a license first, then you can renew it
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm app-surface-card h-100">
              <div className="card-body p-4">
                <h5 className="mb-3">Current License Details</h5>

                <div className="renewal-details-list">
                  <div>
                    <span>License Number</span>
                    <strong>{currentLicense.licenseNumber}</strong>
                  </div>
                  <div>
                    <span>Current Zone</span>
                    <strong>{currentLicense.currentZone || "-"}</strong>
                  </div>
                  <div>
                    <span>Issued On</span>
                    <strong>{formatDate(currentLicense.issuedAt)}</strong>
                  </div>
                  <div>
                    <span>Expiry Date</span>
                    <strong className="text-danger-emphasis">
                      {formatDate(currentLicense.expiresAt)}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 d-flex align-items-center gap-2 flex-wrap">
                  <span className={`badge ${expiryBadgeClass}`}>
                    {currentLicense.isExpired
                      ? "Expired"
                      : currentLicense.isExpiringSoon
                        ? "Expiring in < 30 days"
                        : "Valid"}
                  </span>
                  <span className="text-muted small d-inline-flex align-items-center gap-1">
                    <FiClock />
                    {currentLicense.isExpired
                      ? `Expired ${Math.abs(currentLicense.daysUntilExpiry)} days ago`
                      : `${currentLicense.daysUntilExpiry} days left`}
                  </span>
                </div>

                <hr className="my-4" />

                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Auto-Renewal</h6>
                    <p className="text-muted small mb-0">
                      Automatically create renewal requests before expiry.
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoRenewToggle"
                      checked={autoRenewEnabled}
                      onChange={(e) => setAutoRenewEnabled(e.target.checked)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-3"
                  onClick={handleSaveAutoRenew}
                  disabled={savingAutoRenew}
                >
                  {savingAutoRenew ? "Saving..." : "Save Auto-Renew Preference"}
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <form
              className="card border-0 shadow-sm app-surface-card"
              onSubmit={handleSubmitRenewal}
            >
              <div className="card-body p-4">
                <h5 className="mb-3">Renewal & Payment</h5>
                <div className="mb-3">
                  <span className="badge text-bg-warning">Demo Payment</span>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Renewal Period
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`btn ${
                          selectedPeriod === option.value
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => {
                          setSelectedPeriod(option.value);
                          refreshQuote(option.value);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="renewal-quote-box mb-3">
                  <div>
                    <span>Base Fee</span>
                    <strong>{formatCurrency(quote?.baseAmount)}</strong>
                  </div>
                  <div>
                    <span>Processing Fee</span>
                    <strong>{formatCurrency(quote?.processingFee)}</strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <strong
                      className={
                        quote?.discountAmount > 0
                          ? "text-success"
                          : "text-muted"
                      }
                    >
                      {quote?.discountAmount > 0
                        ? `- ${formatCurrency(quote.discountAmount)} (${quote.discountLabel})`
                        : "No early-bird discount"}
                    </strong>
                  </div>
                  <div className="total-row">
                    <span>Total Payable</span>
                    <strong>{formatCurrency(quote?.payableAmount)}</strong>
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="paymentMethod"
                    className="form-label fw-semibold"
                  >
                    Payment Option
                  </label>
                  <p className="text-muted small mb-2">
                    Demo payment mode: selecting any method and clicking Renew
                    License completes renewal instantly.
                  </p>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FiCreditCard />
                    </span>
                    <select
                      id="paymentMethod"
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                    >
                      {paymentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="renewalNotes"
                    className="form-label fw-semibold"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="renewalNotes"
                    className="form-control"
                    rows="3"
                    placeholder="Add any renewal note, payment details, or support request."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-warning px-4"
                  disabled={submitting || !paymentMethod}
                >
                  {submitting ? "Renewing..." : "Renew License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
