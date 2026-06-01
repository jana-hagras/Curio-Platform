import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid, FiShoppingBag, FiFileText, FiDollarSign, FiUser,
  FiPackage, FiImage, FiSend, FiHeart, FiInbox, FiBriefcase,
  FiBookOpen, FiCalendar, FiMessageSquare
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import BackButton from '../ui/BackButton';
import { useChat } from '../../hooks/useChat';
import './Sidebar.css';

export default function DashboardLayout() {
  const { isBuyer, isArtisan } = useAuth();
  const { totalUnread } = useChat();
  const { t } = useTranslation('common');

  const buyerLinks = [
    { path: '/dashboard', label: t('sidebar.overview'), icon: FiGrid, end: true },
    { path: '/dashboard/orders', label: t('sidebar.myOrders'), icon: FiShoppingBag },
    { path: '/dashboard/requests', label: t('sidebar.myRequests'), icon: FiFileText },
    { path: '/dashboard/mentorships', label: t('sidebar.myMentorships'), icon: FiBookOpen },
    { path: '/dashboard/workshops', label: t('sidebar.myWorkshops'), icon: FiCalendar },
    { path: '/dashboard/proposals', label: t('sidebar.proposals'), icon: FiInbox },
    { path: '/dashboard/favorites', label: t('nav.favorites'), icon: FiHeart },
    { path: '/dashboard/payments', label: t('sidebar.payments'), icon: FiDollarSign },
    { path: '/dashboard/chat', label: t('sidebar.messages'), icon: FiMessageSquare, badge: totalUnread },
    { path: '/dashboard/profile', label: t('nav.profile'), icon: FiUser },
  ];

  const artisanLinks = [
    { path: '/dashboard', label: t('sidebar.overview'), icon: FiGrid, end: true },
    { path: '/dashboard/products', label: t('sidebar.myProducts'), icon: FiPackage },
    { path: '/dashboard/applications', label: t('sidebar.myOrders'), icon: FiBriefcase },
    { path: '/dashboard/mentorships', label: t('sidebar.myMentorships'), icon: FiBookOpen },
    { path: '/dashboard/workshops', label: t('sidebar.myWorkshops'), icon: FiCalendar },
    { path: '/dashboard/portfolio', label: t('sidebar.portfolio'), icon: FiImage },
    { path: '/dashboard/wallet', label: t('sidebar.wallet'), icon: FiDollarSign },
    { path: '/dashboard/chat', label: t('sidebar.messages'), icon: FiMessageSquare, badge: totalUnread },
    { path: '/dashboard/profile', label: t('nav.profile'), icon: FiUser },
  ];

  const links = isBuyer ? buyerLinks : artisanLinks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="dashboard-layout">
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-header">
            <h3>{t('nav.dashboard')}</h3>
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
                {link.badge > 0 && (
                  <span style={{
                    background: 'var(--gold-primary)',
                    color: 'var(--black-deep)',
                    fontSize: '11px',
                    fontWeight: 700,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    marginLeft: 'auto',
                  }}>
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="dashboard-content">
          <BackButton />
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}

