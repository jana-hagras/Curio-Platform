import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid, FiShoppingBag, FiFileText, FiDollarSign, FiUser,
  FiPackage, FiImage, FiSend, FiHeart, FiMessageCircle, FiInbox
} from 'react-icons/fi';
import Navbar from './Navbar';
import BackButton from '../ui/BackButton';
import './Sidebar.css';

export default function DashboardLayout() {
  const { isBuyer, isArtisan } = useAuth();

  const buyerLinks = [
    { path: '/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { path: '/dashboard/orders', label: 'My Orders', icon: FiShoppingBag },
    { path: '/dashboard/requests', label: 'My Requests', icon: FiFileText },
    { path: '/dashboard/favorites', label: 'Favorites', icon: FiHeart },
    { path: '/dashboard/chat', label: 'Chat', icon: FiMessageCircle },
    { path: '/dashboard/payments', label: 'Payments', icon: FiDollarSign },
    { path: '/dashboard/profile', label: 'Profile', icon: FiUser },
  ];

  const artisanLinks = [
    { path: '/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { path: '/dashboard/products', label: 'My Products', icon: FiPackage },
    { path: '/dashboard/portfolio', label: 'Portfolio', icon: FiImage },
    { path: '/dashboard/chat', label: 'Chat', icon: FiMessageCircle },
    { path: '/dashboard/profile', label: 'Profile', icon: FiUser },
  ];

  const links = isBuyer ? buyerLinks : artisanLinks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-layout">
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-header">
            <h3>Dashboard</h3>
          </div>
          <nav className="sidebar-nav">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <link.icon className="sidebar-link-icon" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="dashboard-content">
          <BackButton />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
