import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid, FiUsers, FiShoppingBag, FiFileText, FiPackage,
  FiSettings, FiBarChart2, FiShield, FiLogOut, FiStar, FiCreditCard, FiSend, FiImage
} from 'react-icons/fi';
import Navbar from './Navbar';
import Footer from './Footer';
import './Sidebar.css';

export default function AdminLayout() {
  const { logout } = useAuth();

  const adminLinks = [
    { path: '/admin', label: 'Overview', icon: FiGrid, end: true },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/products', label: 'Products', icon: FiPackage },
    { path: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
    { path: '/admin/requests', label: 'Requests', icon: FiFileText },
    { path: '/admin/applications', label: 'Applications', icon: FiSend },
    { path: '/admin/reviews', label: 'Reviews', icon: FiStar },
    { path: '/admin/payments', label: 'Payments', icon: FiCreditCard },
    { path: '/admin/portfolios', label: 'Portfolios', icon: FiImage },
    { path: '/admin/settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-layout">
        <aside className="sidebar" id="admin-sidebar">
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShield style={{ color: 'var(--gold-primary)', fontSize: 18 }} />
              <h3>Admin Panel</h3>
            </div>
          </div>
          <nav className="sidebar-nav">
            {adminLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <link.icon className="sidebar-link-icon" />
                <span>{link.label}</span>
              </NavLink>
            ))}
            <div style={{ margin: '16px 0', borderTop: '1px solid rgba(212,168,67,0.1)' }} />
            <button
              onClick={logout}
              className="sidebar-link"
              style={{ width: '100%', textAlign: 'left', color: '#EF4444' }}
            >
              <FiLogOut className="sidebar-link-icon" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
