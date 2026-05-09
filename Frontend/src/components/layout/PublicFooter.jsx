import { Link } from "react-router-dom";
import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

export default function PublicFooter() {
  return (
    <footer className="public-footer mt-5">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/features">Features</Link>
              </li>
              <li>
                <Link to="/zones">Vending Zones</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4">
            <h5 className="footer-title">For Vendors</h5>
            <ul className="list-unstyled footer-links">
              <li>
                <Link to="/register">Register</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/vendor/apply">Apply License</Link>
              </li>
              <li>
                <Link to="/vendor/applications">Renew License</Link>
              </li>
              <li>
                <Link to="/faq">Help Center</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4">
            <h5 className="footer-title">Contact Us</h5>
            <p className="mb-2 footer-contact">
              <FiMail /> hawkersystem@gmail.com
            </p>
            <p className="mb-2 footer-contact">
              <FiPhone /> 01775234795
            </p>
            <p className="mb-2 footer-contact">
              <FiMapPin /> 17/9 Avenue, Gulshan 02, Dhaka
            </p>
            <p className="mb-0 footer-contact">
              <FiClock /> Sun-Thus: 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>
      </div>
      <div className="footer-bottom py-3 text-center">
        © 2026 Street Vendor Licensing System. All rights reserved.
      </div>
    </footer>
  );
}
