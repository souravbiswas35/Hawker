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
    applicationId: "",
    amount: "",
    method: "cash",
    transactionId: "",
  });

  async function load() {
    try {
      const { data } = await api.get("/admin/payments");
      setData(data);
    } catch (err) {
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
    try {
      await api.post("/admin/payments/manual", {
        applicationId: Number(manual.applicationId),
        amount: Number(manual.amount),
        method: manual.method,
        transactionId: manual.transactionId || null,
      });
      setManual({
        applicationId: "",
        amount: "",
        method: "cash",
        transactionId: "",
      });
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
                <input
                  className="form-control"
                  placeholder="Application ID"
                  value={manual.applicationId}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, applicationId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Amount"
                  value={manual.amount}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={manual.method}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, method: e.target.value }))
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">Bkash</option>
                  <option value="nagad">Nagad</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                </select>
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Transaction ID (optional)"
                  value={manual.transactionId}
                  onChange={(e) =>
                    setManual((p) => ({ ...p, transactionId: e.target.value }))
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
                    <th>Reference</th>
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
                        {new Date(
                          p.paid_at || p.created_at,
                        ).toLocaleDateString()}
                      </td>
                      <td>{p.email || "-"}</td>
                      <td>
                        {p.source_type === "renewal"
                          ? p.renewal_ref || `#${p.renewal_id}`
                          : p.application_ref || `#${p.application_id}`}
                      </td>
                      <td>
                        <span className="text-capitalize">{p.source_type}</span>
                        {p.is_demo_payment ? (
                          <span className="badge text-bg-warning ms-2">
                            Demo Payment
                          </span>
                        ) : null}
                      </td>
                      <td className="text-capitalize">{p.payment_method}</td>
                      <td className="text-capitalize">{p.payment_status}</td>
                      <td>{Number(p.amount).toLocaleString()}</td>
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
