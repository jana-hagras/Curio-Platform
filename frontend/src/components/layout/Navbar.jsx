import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useRef, useEffect } from "react";
import {
  FiMenu,
  FiX,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiGrid,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiHeart,
  FiMessageCircle,
  FiFileText,
  FiHome,
  FiList,
  FiBriefcase,
  FiInbox,
} from "react-icons/fi";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import "./Navbar.css";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const { user, isAuthenticated, logout, isBuyer, isArtisan } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Role-based navigation links
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { path: "/", label: "Home", icon: FiHome },
        { path: "/marketplace", label: "Marketplace", icon: FiList },
        { path: "/artisans", label: "Artisans", icon: FiUser },
        { path: "/requests", label: "Requests", icon: FiFileText },
      ];
    }

    if (isBuyer) {
      return [
        { path: "/", label: "Home", icon: FiHome },
        { path: "/marketplace", label: "Marketplace", icon: FiList },
        { path: "/dashboard/requests", label: "Requests", icon: FiFileText },
        { path: "/dashboard/proposals", label: "Proposals", icon: FiInbox },
        { path: "/dashboard/favorites", label: "Favorites", icon: FiHeart },
        { path: "/dashboard/chat", label: "Chat", icon: FiMessageCircle },
      ];
    }

    if (isArtisan) {
      return [
        { path: "/dashboard", label: "Dashboard", icon: FiGrid },
        { path: "/dashboard/applications", label: "Orders", icon: FiBriefcase },
        { path: "/requests", label: "Requests", icon: FiFileText },
        { path: "/dashboard/chat", label: "Chat", icon: FiMessageCircle },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const profileImage = user?.profileImage;

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <img src={logo} alt="CURIO" className="navbar-logo-img" />
          <span className="navbar-logo-text">CURIO</span>
        </Link>

        <div
          className={`navbar-links ${mobileOpen ? "navbar-links-open" : ""}`}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${
                link.path === '/' || link.path === '/dashboard'
                  ? location.pathname === link.path ? "navbar-link-active" : ""
                  : location.pathname === link.path || location.pathname.startsWith(link.path + "/") ? "navbar-link-active" : ""
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button
            onClick={toggleTheme}
            className="navbar-cart"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </button>
          {isBuyer && (
            <Link to="/cart" className="navbar-cart" id="navbar-cart">
              <FiShoppingCart />
              {totalItems > 0 && (
                <span className="navbar-cart-badge">{totalItems}</span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <div className="navbar-user-menu" ref={dropdownRef}>
              <button
                className="navbar-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="navbar-user-btn"
              >
                <div className="navbar-avatar">
                  {profileImage ? (
                    <img
                      src={
                        profileImage.startsWith("/")
                          ? `http://localhost:3000${profileImage}`
                          : profileImage
                      }
                      alt=""
                    />
                  ) : (
                    <>
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </>
                  )}
                </div>
                <span className="navbar-username">{user?.firstName}</span>
                <FiChevronDown
                  className={`navbar-chevron ${dropdownOpen ? "navbar-chevron-open" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div className="navbar-dropdown" id="navbar-dropdown">
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="navbar-dropdown-type">{user?.type}</p>
                    </div>
                    <div className="navbar-dropdown-divider" />
                    <Link
                      to="/dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiGrid /> Dashboard
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      className="navbar-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiUser /> Profile
                    </Link>
                    <div className="navbar-dropdown-divider" />
                    <button
                      className="navbar-dropdown-item navbar-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="navbar-auth-btns">
              <Link to="/login" className="navbar-login-btn" id="navbar-login">
                Sign In
              </Link>
              <Link
                to="/register"
                className="navbar-register-btn"
                id="navbar-register"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
