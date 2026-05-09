import { useEffect, useState } from "react";
import { FiUsers } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/admin/vendors");
        setVendors(data.vendors || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load vendors");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="container py-4">
      <PageTitle
        title="Registered Vendors"
        subtitle="Browse all vendors and profile compliance status"
        icon={FiUsers}
        className="mb-4"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading registered vendors..." /> : null}

      {!loading ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Zone</th>
                  <th>Email Verified</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.email}</td>
                    <td>
                      {`${vendor.first_name || ""} ${vendor.last_name || ""}`.trim() ||
                        "-"}
                    </td>
                    <td>{vendor.business_name || "-"}</td>
                    <td>{vendor.vending_zone || "-"}</td>
                    <td>{vendor.is_email_verified ? "Yes" : "No"}</td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No vendors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
