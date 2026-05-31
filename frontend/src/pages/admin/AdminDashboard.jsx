import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FiUsers, FiShoppingBag, FiTrendingUp, FiActivity,
  FiArrowUpRight, FiArrowDownRight, FiClock, FiDollarSign,
  FiPercent, FiBookOpen, FiGrid
} from 'react-icons/fi';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalArtisans: 0,
  });
  const [analytics, setAnalytics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, analyticsRes] = await Promise.all([
          userService.getAll(),
          paymentService.getAnalytics().catch(() => null),
        ]);
        const users = userRes.data?.users || [];

        setStats({
          totalUsers: users.length,
          totalBuyers: users.filter(u => u.type === 'Buyer').length,
          totalArtisans: users.filter(u => u.type === 'Artisan').length,
        });

        if (analyticsRes?.data?.analytics) {
          setAnalytics(analyticsRes.data.analytics);
        }

        // Sort by joinDate descending and take 5
        const sorted = [...users]
          .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
          .slice(0, 5);
        setRecentUsers(sorted);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: '#D4A843',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Buyers',
      value: stats.totalBuyers,
      icon: FiShoppingBag,
      color: '#3B82F6',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Artisans',
      value: stats.totalArtisans,
      icon: FiActivity,
      color: '#10B981',
      trend: '+15%',
      trendUp: true,
    },
    {
      label: 'Platform Health',
      value: '99.9%',
      icon: FiTrendingUp,
      color: '#8B5CF6',
      trend: 'Uptime',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" id="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">
            Welcome back, {user?.firstName || 'Admin'}. Here's what's happening on Curio.
          </p>
        </div>
        <div className="admin-header-badge">
          <FiClock size={14} />
          <span>Last updated: {new Date().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="admin-stat-card"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="admin-stat-info">
              <p className="admin-stat-label">{card.label}</p>
              <h3 className="admin-stat-value">{card.value}</h3>
            </div>
            <div className={`admin-stat-trend ${card.trendUp ? 'trend-up' : 'trend-down'}`}>
              {card.trendUp ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
              <span>{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Analytics */}
      {analytics && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Revenue Analytics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {[
              { label: 'Total Revenue', value: formatCurrency(analytics.totalRevenue), icon: FiDollarSign, color: '#D4A843' },
              { label: 'Platform Commission (10%)', value: formatCurrency(analytics.totalPlatformCommission), icon: FiPercent, color: '#F59E0B' },
              { label: 'Artisan Payouts', value: formatCurrency(analytics.totalArtisanPayouts), icon: FiDollarSign, color: '#10B981' },
              { label: 'Product Revenue', value: formatCurrency(analytics.productRevenue), icon: FiShoppingBag, color: '#3B82F6' },
              { label: 'Workshop Revenue', value: formatCurrency(analytics.workshopRevenue), icon: FiGrid, color: '#8B5CF6' },
              { label: 'Mentorship Revenue', value: formatCurrency(analytics.mentorshipRevenue), icon: FiBookOpen, color: '#EC4899' },
            ].map((card, i) => (
              <div key={i} style={{
                background: 'var(--surface-primary)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)',
                display: 'flex', alignItems: 'center', gap: 14,
                animation: `fadeInUp 0.4s ease ${i * 0.06}s forwards`,
                opacity: 0,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${card.color}15`, color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  <card.icon />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 2 }}>{card.label}</p>
                  <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{card.value}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="admin-content-grid">
        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Users</h3>
            <span className="admin-card-badge">{stats.totalUsers} total</span>
          </div>
          <div className="admin-card-body">
            {recentUsers.length === 0 ? (
              <p className="admin-empty">No users found.</p>
            ) : (
              recentUsers.map((u, i) => (
                <div key={u.id} className="admin-user-row" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="admin-user-avatar" style={{
                    background: u.type === 'Buyer' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: u.type === 'Buyer' ? '#3B82F6' : '#10B981'
                  }}>
                    {u.firstName?.[0] || '?'}{u.lastName?.[0] || ''}
                  </div>
                  <div className="admin-user-info">
                    <p className="admin-user-name">{u.firstName} {u.lastName}</p>
                    <p className="admin-user-email">{u.email}</p>
                  </div>
                  <span className={`admin-role-badge role-${u.type?.toLowerCase()}`}>
                    {u.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Platform Overview</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-overview-item">
              <div className="admin-overview-label">
                <span className="admin-overview-dot" style={{ background: '#D4A843' }} />
                Active Platform
              </div>
              <span className="admin-overview-value" style={{ color: '#10B981' }}>Online</span>
            </div>
            <div className="admin-overview-item">
              <div className="admin-overview-label">
                <span className="admin-overview-dot" style={{ background: '#3B82F6' }} />
                Database
              </div>
              <span className="admin-overview-value" style={{ color: '#10B981' }}>Connected</span>
            </div>
            <div className="admin-overview-item">
              <div className="admin-overview-label">
                <span className="admin-overview-dot" style={{ background: '#10B981' }} />
                Buyer-to-Artisan Ratio
              </div>
              <span className="admin-overview-value">
                {stats.totalArtisans > 0 ? (stats.totalBuyers / stats.totalArtisans).toFixed(1) : '—'}
              </span>
            </div>
            <div className="admin-overview-item">
              <div className="admin-overview-label">
                <span className="admin-overview-dot" style={{ background: '#F59E0B' }} />
                Commission Rate
              </div>
              <span className="admin-overview-value">10%</span>
            </div>
            <div className="admin-overview-item">
              <div className="admin-overview-label">
                <span className="admin-overview-dot" style={{ background: '#8B5CF6' }} />
                API Version
              </div>
              <span className="admin-overview-value">v1.0</span>
            </div>

            <div className="admin-system-info">
              <h4>System Information</h4>
              <div className="admin-system-row">
                <span>Environment</span>
                <span>Development</span>
              </div>
              <div className="admin-system-row">
                <span>Frontend</span>
                <span>React + Vite</span>
              </div>
              <div className="admin-system-row">
                <span>Backend</span>
                <span>Node.js + Express</span>
              </div>
              <div className="admin-system-row">
                <span>Database</span>
                <span>MySQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
