import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/auth/LoginPage.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);

      const redirectPath =
        location.state?.from?.pathname ||
        (data.user.role === "admin" ? "/admin/dashboard" : "/vendor/dashboard");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-lg border-0 auth-card">
            <div className="card-body p-4 p-md-5">
              <PageTitle
                title="Welcome Back"
                subtitle="Login to Hawker system"
                icon={FiLogIn}
                className="mb-3"
              />

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={onSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    required
                  />
                </div>
                <button
                  disabled={loading}
                  className="btn btn-warning btn-lg w-100"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <p className="text-muted mt-3 mb-0">
                New vendor? <Link to="/register">Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
