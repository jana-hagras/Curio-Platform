import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import {
  FiShoppingBag, FiFileText, FiCalendar, FiTrendingUp,
  FiArrowRight, FiPlus, FiHeart, FiClock, FiStar
} from 'react-icons/fi';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, requests: 0, totalSpent: 0, activeRequests: 0 });
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getByBuyer(user.id).catch(() => ({ data: { orders: [] } })),
      requestService.getByBuyer(user.id).catch(() => ({ data: { requests: [] } })),
    ]).then(([oRes, rRes]) => {
      const ords = oRes.data?.orders || [];
      const reqs = rRes.data?.requests || [];
      const totalSpent = ords.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      setOrders(ords);
      setRequests(reqs);
      setStats({
        orders: ords.length,
        requests: reqs.length,
        totalSpent,
        activeRequests: reqs.filter(r => r.status !== 'Completed').length,
      });
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    { label: 'Total Orders', value: stats.orders, icon: FiShoppingBag, color: '#D4A843' },
    { label: 'Custom Requests', value: stats.requests, icon: FiFileText, color: '#3B82F6' },
    { label: 'Total Spent', value: formatCurrency(stats.totalSpent), icon: FiTrendingUp, color: '#10B981' },
    { label: 'Active Requests', value: stats.activeRequests, icon: FiClock, color: '#F59E0B' },
  ];

  const suggestedWorkshops = [
    { title: 'Pottery Making', desc: 'Learn traditional Egyptian pottery', icon: '🏺' },
    { title: 'Jewelry Craft', desc: 'Create stunning handmade jewelry', icon: '💍' },
    { title: 'Textile Weaving', desc: 'Master the art of weaving', icon: '🧶' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Welcome back, {user.firstName}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Discover artisan craftsmanship</p>
        </div>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/requests/new')}>New Request</Button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: 'var(--surface-primary)',
            padding: 24,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            animation: `fadeInUp 0.4s ease ${i * 0.1}s forwards`,
            opacity: 0,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${card.color}15`,
              color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              <card.icon />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 2 }}>{card.label}</p>
              <h3 style={{ fontSize: 24, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content — Full Width */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Recent Orders */}
        <div style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--surface-border)'
          }}>
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Recent Orders</h3>
            <button onClick={() => navigate('/dashboard/orders')}
              style={{ color: 'var(--gold-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {orders.length === 0 ? (
              <p style={{ padding: '32px 24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
                No orders yet. Explore the marketplace!
              </p>
            ) : (
              orders.slice(0, 4).map((order, i) => (
                <div key={order.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px',
                  borderBottom: i < Math.min(orders.length, 4) - 1 ? '1px solid var(--surface-border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(212, 168, 67, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gold-primary)', fontSize: 18,
                    }}>
                      <FiShoppingBag />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>Order #{order.id}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(order.orderDate)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gold-primary)' }}>{formatCurrency(order.totalAmount)}</span>
                    <Badge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Requests — Full Width */}
        <div style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-border)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--surface-border)'
          }}>
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Active Requests</h3>
            <button onClick={() => navigate('/dashboard/requests')}
              style={{ color: 'var(--gold-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {requests.length === 0 ? (
              <p style={{ padding: '32px 24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
                No custom requests. Create one to find artisans!
              </p>
            ) : (
              requests.slice(0, 4).map((req, i) => (
                <div key={req.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px',
                  borderBottom: i < Math.min(requests.length, 4) - 1 ? '1px solid var(--surface-border)' : 'none',
                  cursor: 'pointer',
                }} onClick={() => navigate(`/requests/${req.id}`)}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{req.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{req.category} · {formatCurrency(req.budget)}</p>
                  </div>
                  <Badge status={req.status || 'Pending'} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Secondary Row — Explore & Quick Actions side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Workshop Suggestions */}
          <div style={{
            background: 'var(--surface-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--surface-border)'
            }}>
              <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Explore Crafts</h3>
            </div>
            <div style={{ padding: '8px 0' }}>
              {suggestedWorkshops.map((ws, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  borderBottom: i < suggestedWorkshops.length - 1 ? '1px solid var(--surface-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                   onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                   onClick={() => navigate('/marketplace')}>
                  <span style={{ fontSize: 28 }}>{ws.icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{ws.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ws.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{
            background: 'var(--surface-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
            padding: 24
          }}>
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Browse Marketplace', icon: FiShoppingBag, path: '/marketplace' },
                { label: 'View Favorites', icon: FiHeart, path: '/dashboard/favorites' },
                { label: 'Find Artisans', icon: FiStar, path: '/artisans' },
              ].map((link, i) => (
                <button key={i} onClick={() => navigate(link.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.15s',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: 14, fontWeight: 500,
                  color: 'var(--text-primary)',
                }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                   onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <link.icon style={{ color: 'var(--gold-primary)', fontSize: 18 }} />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
