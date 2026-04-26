import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { marketItemService } from '../../services/marketItemService';
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import {
  FiPackage, FiSend, FiDollarSign, FiMessageCircle,
  FiTrendingUp, FiStar, FiArrowRight, FiPlus, FiBarChart2
} from 'react-icons/fi';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ArtisanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, applications: 0, revenue: 0, reviews: 0 });
  const [products, setProducts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      marketItemService.getByArtisan(user.id).catch(() => ({ data: { items: [] } })),
      applicationService.getByArtisan(user.id).catch(() => ({ data: { applications: [] } })),
      orderService.getAll().catch(() => ({ data: { orders: [] } })),
    ]).then(([pRes, aRes, oRes]) => {
      const prods = pRes.data?.items || [];
      const apps = aRes.data?.applications || [];
      const orders = oRes.data?.orders || [];
      const myOrders = orders.filter(o => prods.some(p => p.id === o.item_id));
      const revenue = myOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      setProducts(prods);
      setApplications(apps);
      setStats({
        products: prods.length,
        applications: apps.length,
        revenue,
        reviews: 0,
      });
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return <Spinner />;

  const statCards = [
    { label: 'Active Products', value: stats.products, icon: FiPackage, color: '#D4A843' },
    { label: 'Sent Proposals', value: stats.applications, icon: FiSend, color: '#3B82F6' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: FiDollarSign, color: '#10B981' },
    { label: 'Total Reviews', value: stats.reviews, icon: FiStar, color: '#F59E0B' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Welcome back, {user.firstName}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Here's what's happening with your craft business</p>
        </div>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/products/new')}>New Product</Button>
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
            transition: 'all 0.2s',
            cursor: 'default',
            animation: `fadeInUp 0.4s ease ${i * 0.1}s forwards`,
            opacity: 0,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${card.color}15`,
              color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22
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

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Products */}
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
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600 }}>My Products</h3>
            <button onClick={() => navigate('/dashboard/products')}
              style={{ color: 'var(--gold-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {products.length === 0 ? (
              <p style={{ padding: '32px 24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
                No products yet. Create your first listing!
              </p>
            ) : (
              products.slice(0, 5).map((product, i) => (
                <div key={product.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  borderBottom: i < Math.min(products.length, 5) - 1 ? '1px solid var(--surface-border)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                   onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                   onClick={() => navigate(`/marketplace/${product.id}`)}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--surface-tertiary)',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {product.image && <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.itemName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{product.category}</p>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gold-primary)' }}>{formatCurrency(product.price)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
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
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Recent Proposals</h3>
            <button onClick={() => navigate('/dashboard/applications')}
              style={{ color: 'var(--gold-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {applications.length === 0 ? (
              <p style={{ padding: '32px 24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
                No proposals submitted yet.
              </p>
            ) : (
              applications.slice(0, 5).map((app, i) => (
                <div key={app.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px',
                  borderBottom: i < Math.min(applications.length, 5) - 1 ? '1px solid var(--surface-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                   onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                   onClick={() => navigate(`/requests/${app.request_id}`)}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.proposal?.slice(0, 50) || 'Proposal'}...
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Request #{app.request_id}</p>
                  </div>
                  <Badge status={app.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {[
          { label: 'Browse Requests', desc: 'Find new craft opportunities', icon: FiMessageCircle, path: '/requests' },
          { label: 'My Portfolio', desc: 'Showcase your best work', icon: FiBarChart2, path: '/dashboard/portfolio' },
          { label: 'View Analytics', desc: 'Track your performance', icon: FiTrendingUp, path: '/dashboard' },
        ].map((action, i) => (
          <div key={i} onClick={() => navigate(action.path)} style={{
            background: 'var(--surface-primary)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 16,
          }} onMouseOver={e => {
            e.currentTarget.style.borderColor = 'var(--gold-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }} onMouseOut={e => {
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(212, 168, 67, 0.1)',
              color: 'var(--gold-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              <action.icon />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{action.label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{action.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
