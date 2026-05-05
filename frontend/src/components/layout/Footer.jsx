import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import Modal from "../ui/Modal";
import "./Footer.css";
import logo from "../../assets/logo.png";

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={logo} alt="CURIO" className="navbar-logo-img" />
              <span className="footer-logo-text">CURIO</span>
            </Link>
            <p className="footer-tagline">
              Connecting the world with Egypt's finest artisan craftsmanship.
              Discover unique, handmade treasures.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Explore</h4>
            <Link to="/marketplace" className="footer-link">
              Marketplace
            </Link>
            <Link to="/artisans" className="footer-link">
              Artisans
            </Link>
            <Link to="/requests" className="footer-link">
              Custom Requests
            </Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Account</h4>
            <Link to="/login" className="footer-link">
              Sign In
            </Link>
            <Link to="/register" className="footer-link">
              Sign Up
            </Link>
            <Link to="/dashboard" className="footer-link">
              Dashboard
            </Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Contact</h4>
            <div className="footer-contact-item">
              <FiMail /> <span>hello@curio.com</span>
            </div>
            <div className="footer-contact-item">
              <FiPhone /> <span>+20 123 456 789</span>
            </div>
            <div className="footer-contact-item">
              <FiMapPin /> <span>Cairo, Egypt</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CURIO. All rights reserved.</p>
          <div className="footer-bottom-links">
            <button
              type="button"
              className="footer-bottom-link footer-link-button"
              onClick={() => setActiveModal("privacy")}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="footer-bottom-link footer-link-button"
              onClick={() => setActiveModal("terms")}
            >
              Terms of Service
            </button>
          </div>
        </div>

        <Modal
          isOpen={activeModal === "privacy"}
          onClose={closeModal}
          title="Privacy Policy"
          size="lg"
        >
          <p>
            CURIO collects only the information needed to provide services,
            process orders, and communicate with users. We never sell personal
            data and we protect stored information with reasonable security
            controls.
          </p>
          <p>
            We may use your email address, name, and preferences to personalize
            your experience, send confirmations, and respond to support
            requests.
          </p>
          <p>
            If you have questions about your information, contact us at
            hello@curio.com.
          </p>
        </Modal>

        <Modal
          isOpen={activeModal === "terms"}
          onClose={closeModal}
          title="Terms of Service"
          size="lg"
        >
          <p>
            By using CURIO, you agree to follow our platform rules, provide
            accurate information, and respect the rights of artisans and buyers.
          </p>
          <p>
            All purchases are subject to the terms of the relevant offer and
            delivery timelines. CURIO is not responsible for third-party
            disputes, but we encourage fair resolution.
          </p>
          <p>
            Continued use of the platform constitutes acceptance of these terms.
          </p>
        </Modal>
      </div>
    </footer>
  );
}
