import { useEffect, useState } from "react";
import { FiDollarSign, FiPlusCircle } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminPaymentsPage.css";

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ stats: {}, payments: [] });
  const [manual, setManual] = useState({
    userId: "",
    amount: "",
    paymentTypeId: "1",
    paymentMethodId: "5",
    notes: "",
  });
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        api.get("/payments/admin/stats"),
        api.get("/payments/admin/all"),
      ]);
      console.log("Admin stats:", statsRes.data);
      console.log("Admin payments:", paymentsRes.data);
      setData({
        stats: statsRes.data,
        payments: paymentsRes.data.payments,
      });
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleManualPayment(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/payments/admin/manual", {
        user_id: Number(manual.userId),
        payment_type_id: Number(manual.paymentTypeId),
        payment_method_id: Number(manual.paymentMethodId),
        amount: Number(manual.amount),
        notes: manual.notes || "Manual payment by admin",
      });
      setManual({
        userId: "",
        amount: "",
        paymentTypeId: "1",
        paymentMethodId: "5",
        notes: "",
      });
      setSuccess("Payment added successfully!");
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create manual payment",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Payment & Revenue Management</h4>
        <button className="btn btn-primary btn-sm">Export Report</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading ? <LoadingState label="Loading payments..." /> : null}

      {!loading && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-blue">
                <h3>
                  {Number(data.stats.revenue_this_month || 0).toLocaleString()}
                </h3>
                <p>Revenue This Month</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-green">
                <h3>
                  {Number(data.stats.collected_today || 0).toLocaleString()}
                </h3>
                <p>Today's Collection</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-red">
                <h3>{data.stats.pending_count || 0}</h3>
                <p>Pending Transactions</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-yellow">
                <h3>
                  {Number(data.stats.pending_amount || 0).toLocaleString()}
                </h3>
                <p>Outstanding Amount</p>
              </div>
            </div>
          </div>

          <div className="panel-box mb-4">
            <h5 className="mb-3">
              <FiPlusCircle className="me-2" />
              Manual Payment Entry
            </h5>
            <form onSubmit={handleManualPayment} className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Vendor User ID *</label>
                <input
                  className="form-control"
                  placeholder="Enter User ID"
                  value={manual.userId}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, userId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Amount (BDT) *</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="Enter amount"
                  value={manual.amount}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Payment Type *</label>
                <select
                  className="form-select"
                  value={manual.paymentTypeId}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, paymentTypeId: e.target.value }))
                  }
                  required
                >
                  <option value="1">License Fee</option>
                  <option value="2">Renewal Fee</option>
                  <option value="3">Penalty</option>
                  <option value="4">Other</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={manual.paymentMethodId}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, paymentMethodId: e.target.value }))
                  }
                  required
                >
                  <option value="1">Credit/Debit Card</option>
                  <option value="2">Net Banking</option>
                  <option value="3">UPI</option>
                  <option value="4">Mobile Wallet</option>
                  <option value="5">Cash at Office</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Notes (Optional)</label>
                <input
                  className="form-control"
                  placeholder="Add any notes"
                  value={manual.notes}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-success" disabled={saving}>
                  {saving ? "Saving..." : "Add Payment"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel-box">
            <h5 className="mb-3">
              <FiDollarSign className="me-2" />
              Recent Transactions
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Transaction ID</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td>
                        {p.email || p.business_name || "-"}
                        {p.first_name && (
                          <small className="d-block text-muted">
                            {p.first_name} {p.last_name}
                          </small>
                        )}
                      </td>
                      <td>
                        <code className="small">{p.transaction_id}</code>
                      </td>
                      <td>{p.payment_type}</td>
                      <td>{p.payment_method}</td>
                      <td>
                        <span className={`badge ${
                          p.status === 'completed' ? 'bg-success' : 
                          p.status === 'pending' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{Number(p.final_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {data.payments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-muted">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
