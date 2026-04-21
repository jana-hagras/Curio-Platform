import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import { requestService } from '../../services/requestService';
import { FiShoppingBag, FiFileText, FiDollarSign } from 'react-icons/fi';
import Spinner from '../../components/ui/Spinner';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, requests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getByBuyer(user.id).catch(() => ({ data: { orders: [] } })),
      requestService.getByBuyer(user.id).catch(() => ({ data: { requests: [] } }))
    ]).then(([oRes, rRes]) => {
      setStats({
        orders: oRes.data.orders?.length || 0,
        requests: rRes.data.requests?.length || 0
      });
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome back, {user.firstName}!</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--sand-warm)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200, 151, 46, 0.1)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><FiShoppingBag /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Orders</p><h3 style={{ fontSize: 24 }}>{stats.orders}</h3></div>
        </div>
        <div style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--sand-warm)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200, 151, 46, 0.1)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><FiFileText /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Custom Requests</p><h3 style={{ fontSize: 24 }}>{stats.requests}</h3></div>
        </div>
      </div>
    </div>
  );
}
