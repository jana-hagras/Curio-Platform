import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { marketItemService } from '../../services/marketItemService';
import { FiPackage, FiSend } from 'react-icons/fi';
import Spinner from '../../components/ui/Spinner';

export default function ArtisanDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      marketItemService.getByArtisan(user.id).catch(() => ({ data: { items: [] } })),
      applicationService.getByArtisan(user.id).catch(() => ({ data: { applications: [] } }))
    ]).then(([pRes, aRes]) => {
      setStats({
        products: pRes.data.items?.length || 0,
        applications: aRes.data.applications?.length || 0
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
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200, 151, 46, 0.1)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><FiPackage /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Active Products</p><h3 style={{ fontSize: 24 }}>{stats.products}</h3></div>
        </div>
        <div style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--sand-warm)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200, 151, 46, 0.1)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><FiSend /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sent Applications</p><h3 style={{ fontSize: 24 }}>{stats.applications}</h3></div>
        </div>
      </div>
    </div>
  );
}
