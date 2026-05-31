import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiPlusCircle } from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import AdminLayout from "../../components/layout/AdminLayout";
import "../../styles/pages/admin/AdminZonesPage.css";

export default function AdminZonesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ stats: {}, zones: [] });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/admin/zones-management");
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load zones");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="admin-feature-header mb-4">
        <h4 className="mb-0">Zone & Location Management</h4>
        <Link
          to="/admin/zones-management/new"
          className="btn btn-success btn-sm"
        >
          <FiPlusCircle className="me-2" />
          Add New Zone
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <LoadingState label="Loading zones..." /> : null}

      {!loading && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-green">
                <h3>{data.stats.total_zones || 0}</h3>
                <p>Total Zones</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-blue">
                <h3>{data.stats.occupied_spots || 0}</h3>
                <p>Occupied Spots</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-teal">
                <h3>{data.stats.available_spots || 0}</h3>
                <p>Available Spots</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="admin-kpi-card kpi-yellow">
                <h3>{data.stats.avg_occupancy || 0}%</h3>
                <p>Average Occupancy</p>
              </div>
            </div>
          </div>

          <div className="panel-box">
            <h5 className="mb-3">
              <FiMapPin className="me-2" />
              Zones
            </h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Area</th>
                    <th>Capacity</th>
                    <th>Available</th>
                    <th>Facilities</th>
                  </tr>
                </thead>
                <tbody>
                  {data.zones.map((z) => (
                    <tr key={z.id}>
                      <td>{z.zone_code}</td>
                      <td>{z.name}</td>
                      <td>{z.area}</td>
                      <td>{z.total_spots}</td>
                      <td>{z.available_spots}</td>
                      <td>
                        {[
                          z.has_electricity && "Electricity",
                          z.has_water && "Water",
                          z.has_shade && "Shade",
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                    </tr>
                  ))}
                  {data.zones.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-muted">
                        No zones found.
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
