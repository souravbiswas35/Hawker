import { FiCheckCircle } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";

function formatDate(dateString) {
  if (!dateString) return "Updated successfully";
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return null;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export default function VendorRenewalSuccessPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <VendorLayout>
      <PageTitle
        title="Renewal Confirmed"
        subtitle="Payment has been confirmed and your license has been renewed."
        icon={FiCheckCircle}
        className="mb-4"
      />

      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4 p-lg-5">
          <div className="alert alert-success mb-4" role="alert">
            <strong>Success:</strong> Payment confirmed and license renewal
            completed.
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="text-muted small d-block">
                Renewal Reference
              </label>
              <div className="fw-semibold">{state?.renewalRef || "-"}</div>
            </div>
            <div className="col-md-6">
              <label className="text-muted small d-block">Renewed Until</label>
              <div className="fw-semibold">
                {formatDate(state?.renewedUntil)}
              </div>
            </div>
            <div className="col-md-6">
              <label className="text-muted small d-block">Payment Method</label>
              <div className="fw-semibold text-capitalize">
                {state?.paymentMethod || "Demo"}
              </div>
            </div>
            <div className="col-md-6">
              <label className="text-muted small d-block">Amount</label>
              <div className="fw-semibold">
                {formatCurrency(state?.payableAmount) || "-"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={() => navigate("/vendor/dashboard")}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </VendorLayout>
  );
}
