import { useEffect, useState } from "react";
import {
  FiFileText,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorPaymentsPage.css";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);
}

export default function VendorPaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    transaction_id: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.transaction_id) params.transaction_id = filters.transaction_id;

      const res = await api.get("/payments/vendor/history", { params });
      setPayments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    loadPayments();
  };

  const clearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      transaction_id: "",
    });
    loadPayments();
  };

  const handleDownloadStatement = async () => {
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const res = await api.get("/payments/vendor/statement/download", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "payment-statement.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download statement:", err);
      setError("Failed to download statement");
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    // Receipt download feature not yet implemented
    alert("Receipt download feature is coming soon. Please check back later.");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="badge bg-success bg-opacity-10 text-success">
            <FiCheckCircle className="me-1" /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="badge bg-warning bg-opacity-10 text-warning">
            <FiClock className="me-1" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger">
            <FiXCircle className="me-1" /> Failed
          </span>
        );
      case "refunded":
        return (
          <span className="badge bg-secondary bg-opacity-10 text-secondary">
            Refunded
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary bg-opacity-10 text-secondary">
            {status}
          </span>
        );
    }
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Payment History"
        subtitle="View and manage all your payment transactions."
        icon={FiFileText}
        iconSize={62}
        className="mb-4"
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4">
          {/* Filter Section */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="me-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleDownloadStatement}
              >
                <FiDownload className="me-2" />
                Download Statement
              </button>
            </div>
            <div className="text-muted small">
              {payments.length} payment(s) found
            </div>
          </div>

          {showFilters && (
            <div className="card bg-light mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      className="form-control"
                      value={filters.start_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      className="form-control"
                      value={filters.end_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Search by Transaction ID</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FiSearch />
                      </span>
                      <input
                        type="text"
                        name="transaction_id"
                        className="form-control"
                        placeholder="Enter transaction ID..."
                        value={filters.transaction_id}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-2 d-flex align-items-end gap-2">
                    <button className="btn btn-primary flex-grow-1" onClick={applyFilters}>
                      Apply
                    </button>
                    <button className="btn btn-outline-secondary" onClick={clearFilters}>
                      <FiX />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Table */}
          {loading ? (
            <LoadingState label="Loading payment history..." />
          ) : payments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiFileText size={64} className="mb-3" />
              <h5>No Payment History Found</h5>
              <p>Try adjusting your filters or make a payment to see history here.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Payment Type</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Discount</th>
                    <th>Final Amount</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <code className="small">{payment.transaction_id}</code>
                      </td>
                      <td>
                        <span className="fw-semibold">{payment.payment_type}</span>
                      </td>
                      <td>{payment.payment_method}</td>
                      <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                      <td className="text-success">
                        {payment.discount_amount > 0 ? formatCurrency(payment.discount_amount) : "-"}
                      </td>
                      <td className="fw-bold text-success">{formatCurrency(payment.final_amount)}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td className="text-muted small">{formatDate(payment.payment_date)}</td>
                      <td className="text-muted small" style={{ maxWidth: "150px" }}>
                        {payment.notes ? (
                          <span title={payment.notes}>
                            {payment.notes.length > 20 ? payment.notes.substring(0, 20) + "..." : payment.notes}
                          </span>
                        ) : "-"}
                      </td>
                      <td>
                        {payment.status === "completed" && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            title="Download Receipt"
                          >
                            <FiDownload />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Statistics */}
          {!loading && payments.length > 0 && (
            <div className="row g-3 mt-4">
              <div className="col-md-3">
                <div className="card bg-light border-0">
                  <div className="card-body p-3">
                    <small className="text-muted d-block">Total Transactions</small>
                    <strong className="fs-5">{payments.length}</strong>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light border-0">
                  <div className="card-body p-3">
                    <small className="text-muted d-block">Total Amount Paid</small>
                    <strong className="fs-5 text-success">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.final_amount, 0))}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light border-0">
                  <div className="card-body p-3">
                    <small className="text-muted d-block">Total Discount</small>
                    <strong className="fs-5 text-success">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.discount_amount, 0))}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light border-0">
                  <div className="card-body p-3">
                    <small className="text-muted d-block">Completed Payments</small>
                    <strong className="fs-5 text-success">
                      {payments.filter(p => p.status === "completed").length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
