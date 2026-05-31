import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import PageTitle from "../../components/common/PageTitle";
import "../../styles/pages/auth/VerifyEmailPage.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(
    () => searchParams.get("email") || "",
    [searchParams],
  );
  const [form, setForm] = useState({ email: initialEmail, code: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/verify-email", form);
      login(data.token, data.user);
      navigate("/vendor/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-code", {
        email: form.email,
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow-lg border-0 auth-card">
            <div className="card-body p-4 p-md-5">
              <PageTitle
                title="Verify Email"
                subtitle="Enter the 6-digit code sent to your email"
                icon={FiCheckCircle}
                className="mb-3"
              />

              {message && <div className="alert alert-success">{message}</div>}
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
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="code"
                    value={form.code}
                    onChange={onChange}
                    required
                    maxLength={6}
                  />
                </div>
                <button
                  disabled={loading}
                  className="btn btn-warning btn-lg w-100"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <button
                className="btn btn-link p-0 mt-3"
                type="button"
                onClick={resend}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend verification code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
