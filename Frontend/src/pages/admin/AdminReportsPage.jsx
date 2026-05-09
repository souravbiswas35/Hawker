import { useEffect, useState } from "react";
import {
  FiDownload,
  FiFileText,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";

const reportTypeOptions = [
  "vendor",
  "license",
  "compliance",
  "finance",
  "performance",
];
const visualOptions = [
  { value: "table", label: "Table", icon: FiFileText },
  { value: "pie", label: "Pie Chart", icon: FiPieChart },
  { value: "line", label: "Line Graph", icon: FiTrendingUp },
];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ stats: {}, reports: [] });
  const [form, setForm] = useState({
    reportType: "vendor",
    reportPeriod: "Last 30 Days",
    visualType: "table",
    filters: { zone: "all", status: "all", type: "all" },
  });

  async function fetchOverview() {
    try {
      const { data } = await api.get("/admin/reports/overview");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/reports/generate", form);
      await fetchOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Report & Analytics</h4>
        <button className="btn btn-success btn-sm">
          <FiDownload className="me-2" /> Export Application
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading reports..." /> : null}

      {!loading && (
        <>
          <div className="panel-box mb-4">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="admin-kpi-card kpi-green">
                  <h3>{(data.stats.total_vendors || 0).toLocaleString()}</h3>
                  <p>Total Vendors</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-kpi-card kpi-blue">
                  <h3>
                    {Number(data.stats.total_revenue || 0).toLocaleString()}
                  </h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-kpi-card kpi-teal">
                  <h3>{(data.stats.active_licenses || 0).toLocaleString()}</h3>
                  <p>Active Licenses</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="admin-kpi-card kpi-yellow">
                  <h3>{data.stats.total_reports || 0}</h3>
                  <p>Generated Reports</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-box mb-4">
            <h5 className="mb-3">Generate Report</h5>
            <form onSubmit={handleGenerate} className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Report Type</label>
                <select
                  className="form-select"
                  value={form.reportType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reportType: e.target.value }))
                  }
                >
                  {reportTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Time Period</label>
                <input
                  className="form-control"
                  value={form.reportPeriod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reportPeriod: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Visualization Type</label>
                <div className="d-flex gap-2 flex-wrap">
                  {visualOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        className={`btn ${form.visualType === opt.value ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            visualType: opt.value,
                          }))
                        }
                      >
                        <Icon className="me-2" /> {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving ? "Generating..." : "Generate Report"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel-box">
            <h5 className="mb-3">Recently Generated Reports</h5>
            <div className="row g-3">
              {(data.reports || []).map((item) => (
                <div key={item.id} className="col-md-4">
                  <div className="admin-report-card">
                    <h6 className="mb-2 text-capitalize">{item.report_name}</h6>
                    <div className="small text-muted mb-2 text-capitalize">
                      {item.report_type} • {item.report_period}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-success text-capitalize">
                        {item.status}
                      </span>
                      <span className="small text-muted">
                        {item.file_size_kb} KB
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(data.reports || []).length === 0 && (
                <div className="col-12 text-muted">No reports yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
