import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiOutlineHome, HiOutlineInformationCircle } from "react-icons/hi2";
import {
  FiGrid,
  FiMapPin,
  FiHelpCircle,
  FiLogIn,
  FiUserPlus,
  FiLayout,
  FiUsers,
  FiFileText,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAuthenticated && user?.role === "admin";
  const isVendor = isAuthenticated && user?.role === "vendor";
  const showPublicLinks = !isAuthenticated;
  const brandLink = isAdmin
    ? "/admin/dashboard"
    : isVendor
      ? "/vendor/dashboard"
      : "/";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg hawker-nav sticky-top">
      <div className="container">
        <Link
          className="navbar-brand fw-bold text-light d-flex align-items-center gap-1"
          to={brandLink}
        >
          <span className="brand-badge">
            <img
              src="/images/logo.png"
              alt="logo"
              style={{ height: "42px", width: "42px" }}
            />
          </span>
          Hawker
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hawkerNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="hawkerNav">
          {showPublicLinks && (
            <ul className="navbar-nav mx-auto align-items-lg-center gap-lg-2 justify-content-center">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">
                  <HiOutlineHome />
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                  <HiOutlineInformationCircle />
                  About Us
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/features">
                  <FiGrid />
                  Features
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/zones">
                  <FiMapPin />
                  Zones
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/faq">
                  <FiHelpCircle />
                  FAQ
                </NavLink>
              </li>
            </ul>
          )}

          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    className="btn btn-outline-light btn-sm rounded-pill px-3"
                    to="/login"
                  >
                    <FiLogIn />
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="btn btn-warning btn-sm rounded-pill px-3"
                    to="/register"
                  >
                    <FiUserPlus />
                    Registration
                  </NavLink>
                </li>
              </>
            )}

            {isAuthenticated && user?.role === "vendor" && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/vendor/dashboard">
                    <FiLayout />
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/vendor/profile">
                    <FiUsers />
                    Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/vendor/documents">
                    <FiFileText />
                    Documents
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/vendor/apply">
                    Apply License
                  </NavLink>
                </li>
              </>
            )}

            {isAdmin && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/dashboard">
                    <FiLayout />
                    Admin Panel
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/applications">
                    Applications
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/vendors">
                    Vendors
                  </NavLink>
                </li>
              </>
            )}

            {isAuthenticated && (
              <li className="nav-item d-flex align-items-center gap-2 ms-lg-3">
                <button
                  className="btn btn-outline-light btn-sm rounded-circle"
                  style={{ width: "40px", height: "40px", padding: "0" }}
                  onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/vendor/profile")}
                >
                  <FiUser />
                </button>
                <button
                  className="btn btn-outline-light btn-sm rounded-pill"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
