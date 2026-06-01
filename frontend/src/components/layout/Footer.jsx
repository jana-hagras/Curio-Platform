import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "./Footer.css";
import logo from "../../assets/logo.png";

export default function Footer() {
  const { t, i18n } = useTranslation('common');

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
              {t('footer.tagline')}
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer.explore')}</h4>
            <Link to="/marketplace" className="footer-link">
              {t('nav.marketplace')}
            </Link>
            <Link to="/artisans" className="footer-link">
              {t('nav.artisans')}
            </Link>
            <Link to="/requests" className="footer-link">
              {t('footer.customRequests')}
            </Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer.account')}</h4>
            <Link to="/login" className="footer-link">
              {t('nav.signIn')}
            </Link>
            <Link to="/register" className="footer-link">
              {t('nav.signUp')}
            </Link>
            <Link to="/dashboard" className="footer-link">
              {t('nav.dashboard')}
            </Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">{t('footer.contact')}</h4>
            <div className="footer-contact-item">
              <FiMail /> <span>hello@curio.com</span>
            </div>
            <div className="footer-contact-item">
              <FiPhone /> <span>+20 123 456 789</span>
            </div>
            <div className="footer-contact-item">
              <FiMapPin /> <span>{t('auth.register.country')}</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy" className="footer-bottom-link">
              {t('footer.privacy')}
            </Link>
            <Link to="/cookie-policy" className="footer-bottom-link">
              {i18n.language === 'ar' ? 'سياسة ملفات الارتباط' : 'Cookie Policy'}
            </Link>
            <Link to="/terms" className="footer-bottom-link">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

