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
import "../../styles/pages/admin/AdminReportsPage.css";

const reportTypeOptions = [
  "vendor",
  "license",
  "compliance",
  "finance",
  "performance",
];
const visualOptions = [
  { value: "table", label: "Table", icon: FiFileText },
  { value: "bar", label: "Bar Chart", icon: FiBarChart2 },
  { value: "line", label: "Line Chart", icon: FiTrendingUp },
];

const timePeriodOptions = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
  "This Year",
];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ stats: {}, reports: [] });
  const [chartData, setChartData] = useState({ labels: [], data: [] });
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

  async function fetchChartData() {
    try {
      const { data } = await api.get("/admin/reports/data", {
        params: {
          reportType: form.reportType,
          reportPeriod: form.reportPeriod,
          visualType: form.visualType,
        },
      });
      setChartData(data);
    } catch (err) {
      console.error("Failed to load chart data:", err);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [form.reportType, form.reportPeriod, form.visualType]);

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

  const handleDownloadReport = (report) => {
    // Create a simple CSV download
    const csvContent = `Report Name,Type,Period,Status,File Size\n${report.report_name},${report.report_type},${report.report_period},${report.status},${report.file_size_kb} KB`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (form.visualType === "table") {
      return (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Date/Label</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels?.map((label, index) => (
                <tr key={index}>
                  <td>{label}</td>
                  <td>{chartData.data[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (form.visualType === "bar") {
      const maxValue = Math.max(...(chartData.data || [0]));
      return (
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "300px", borderBottom: "2px solid #dee2e6" }}>
            {chartData.labels?.map((label, index) => {
              const value = chartData.data[index] || 0;
              const height = maxValue > 0 ? (value / maxValue) * 280 : 0;
              return (
                <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${height}px`,
                      backgroundColor: "#0d6efd",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                      minHeight: value > 0 ? "20px" : "0",
                    }}
                    title={`${label}: ${value}`}
                  />
                  <div style={{ fontSize: "10px", marginTop: "5px", textAlign: "center", transform: "rotate(-45deg)", transformOrigin: "top left" }}>
                    {label.substring(5)}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (form.visualType === "line") {
      const maxValue = Math.max(...(chartData.data || [0]));
      const width = Math.max(chartData.labels?.length * 80, 600);
      const height = 350;
      return (
        <div style={{ maxHeight: "400px", overflowX: "auto", padding: "20px" }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1="50"
                y1={height - 50 - (percent / 100) * (height - 100)}
                x2={width - 30}
                y2={height - 50 - (percent / 100) * (height - 100)}
                stroke="#e9ecef"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <text
                key={percent}
                x="40"
                y={height - 50 - (percent / 100) * (height - 100) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6c757d"
              >
                {Math.round((maxValue * percent) / 100)}
              </text>
            ))}

            {/* Line path */}
            {chartData.labels?.length > 0 && (
              <polyline
                points={chartData.labels.map((_, index) => {
                  const value = chartData.data[index] || 0;
                  const x = 70 + index * ((width - 100) / Math.max(chartData.labels.length - 1, 1));
                  const y = height - 50 - (value / maxValue) * (height - 100);
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#0d6efd"
                strokeWidth="3"
              />
            )}

            {/* Data points and labels */}
            {chartData.labels?.map((label, index) => {
              const value = chartData.data[index] || 0;
              const x = 70 + index * ((width - 100) / Math.max(chartData.labels.length - 1, 1));
              const y = height - 50 - (value / maxValue) * (height - 100);
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="6" fill="#0d6efd" stroke="#fff" strokeWidth="2" />
                  <text x={x} y={height - 30} textAnchor="middle" fontSize="10" fill="#6c757d">
                    {label.substring(5)}
                  </text>
                  <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0d6efd">
                    {value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    return null;
  };

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
                <select
                  className="form-select"
                  value={form.reportPeriod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reportPeriod: e.target.value,
                    }))
                  }
                >
                  {timePeriodOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
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

          {chartData.labels?.length > 0 && (
            <div className="panel-box mb-4">
              <h5 className="mb-3">
                {form.reportType} Report - {form.reportPeriod}
              </h5>
              {renderChart()}
            </div>
          )}

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
                      <div className="d-flex gap-2 align-items-center">
                        <span className="small text-muted">
                          {item.file_size_kb} KB
                        </span>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownloadReport(item)}
                        >
                          <FiDownload />
                        </button>
                      </div>
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
