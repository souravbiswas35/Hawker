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

import { useEffect, useState } from "react";

import api from "../../api/client";

import ThemeToggle from "../common/ThemeToggle";



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

  const [profilePictureUrl, setProfilePictureUrl] = useState(null);



  useEffect(() => {

    async function loadProfilePicture() {

      if (isAuthenticated && isVendor) {

        try {

          const res = await api.get("/vendor/profile");

          if (res.data.profile?.profile_picture_url) {

            try {

              const imgRes = await api.get("/vendor/profile-picture", {

                responseType: 'blob'

              });

              const imageUrl = URL.createObjectURL(imgRes.data);

              setProfilePictureUrl(imageUrl);

            } catch (imgErr) {

              console.error("Failed to load profile picture:", imgErr);

            }

          }

        } catch (err) {

          console.error("Failed to load profile:", err);

        }

      }

    }

    loadProfilePicture();

  }, [isAuthenticated, isVendor]);



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

            <li className="nav-item">

              <ThemeToggle />

            </li>

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

                <div

                  className="position-relative"

                  style={{ cursor: "pointer" }}

                  onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/vendor/profile")}

                  title={isAdmin ? "Admin" : "Vendor"}

                  onMouseEnter={(e) => {

                    const badge = e.currentTarget.querySelector('.badge');

                    if (badge) badge.style.opacity = '1';

                  }}

                  onMouseLeave={(e) => {

                    const badge = e.currentTarget.querySelector('.badge');

                    if (badge) badge.style.opacity = '0';

                  }}

                >

                  {profilePictureUrl ? (

                    <img

                      src={profilePictureUrl}

                      alt="Profile"

                      className="rounded-circle"

                      style={{

                        width: "30px",

                        height: "30px",

                        objectFit: "cover",

                        border: "2px solid rgba(255, 255, 255, 0.3)",

                      }}

                    />

                  ) : (

                    <button

                      className="btn btn-outline-light btn-sm rounded-circle d-flex align-items-center justify-content-center"

                      style={{ width: "30px", height: "30px", padding: "0" }}

                    >

                      <FiUser />

                    </button>

                  )}

                  <span

                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"

                    style={{

                      fontSize: "0.65rem",

                      padding: "0.25rem 0.5rem",

                      opacity: 0,

                      transition: "opacity 0.2s",

                      pointerEvents: "none",

                    }}

                  >

                    {isAdmin ? "Admin" : "Vendor"}

                  </span>

                </div>

                <button

                  className="btn btn-sm rounded-pill logout-btn"

                  onClick={handleLogout}

                  style={{
                    background: "transparent",
                    border: "2px solid #dc2626",
                    color: "#dc2626",
                    fontWeight: "700",
                    transition: "all 0.3s ease",
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.8rem",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#dc2626";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "#dc2626";
                  }}
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

