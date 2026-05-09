import { useEffect, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";

const statuses = ["new", "in_progress", "resolved", "closed"];

export default function AdminComplaintsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [complaints, setComplaints] = useState([]);

  async function load() {
    try {
      const { data } = await api.get("/admin/complaints");
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/complaints/${id}`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Complaint Management</h4>
        <button className="btn btn-success btn-sm">Export Applications</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading complaints..." /> : null}

      {!loading && (
        <div className="panel-box">
          <h5 className="mb-3">
            <FiMessageSquare className="me-2" />
            Complaint Queue
          </h5>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>{c.complaint_ref}</td>
                    <td>
                      {c.first_name
                        ? `${c.first_name} ${c.last_name || ""}`.trim()
                        : c.email}
                    </td>
                    <td>{c.category}</td>
                    <td className="text-capitalize">{c.priority}</td>
                    <td className="text-capitalize">
                      {c.status.replace("_", " ")}
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        disabled={updatingId === c.id}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-muted">
                      No complaints available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
