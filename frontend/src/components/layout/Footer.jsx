import { Link } from 'react-router-dom';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/logo.png" alt="CURIO" className="footer-logo-img" />
              <span className="footer-logo-text">CURIO</span>
            </Link>
            <p className="footer-tagline">
              Connecting the world with Egypt's finest artisan craftsmanship. Discover unique, handmade treasures.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Explore</h4>
            <Link to="/marketplace" className="footer-link">Marketplace</Link>
            <Link to="/artisans" className="footer-link">Artisans</Link>
            <Link to="/requests" className="footer-link">Custom Requests</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Account</h4>
            <Link to="/login" className="footer-link">Sign In</Link>
            <Link to="/register" className="footer-link">Sign Up</Link>
            <Link to="/dashboard" className="footer-link">Dashboard</Link>
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
            <span className="footer-bottom-link">Privacy Policy</span>
            <span className="footer-bottom-link">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
