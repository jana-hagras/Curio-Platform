import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { workshopRegistrationService } from '../../services/workshopRegistrationService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiCalendar, FiClock, FiExternalLink } from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';

export default function BuyerWorkshopsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workshopRegistrationService.getByBuyer(user.id)
      .then(res => setRegistrations(res.data?.registrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Workshops</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>View your workshop registrations</p>
        </div>
        <Button onClick={() => navigate('/workshops')}>Browse Workshops</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Registered', value: registrations.filter(r => r.status === 'Registered').length, icon: FiCalendar, color: '#3B82F6' },
          { label: 'Confirmed', value: registrations.filter(r => r.status === 'Confirmed').length, icon: FiCalendar, color: '#10B981' },
          { label: 'Total', value: registrations.length, icon: FiCalendar, color: '#D4A843' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><s.icon /></div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.label}</p>
              <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}><FiCalendar /></div>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', marginBottom: 8 }}>No Workshops Registered</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Browse and register for upcoming workshops</p>
          <Button onClick={() => navigate('/workshops')}>Browse Workshops</Button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
          {registrations.map((r, i) => (
            <div key={r.id} style={{
              padding: '20px 24px',
              borderBottom: i < registrations.length - 1 ? '1px solid var(--surface-border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => navigate(`/workshops/${r.workshop_id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}><FiCalendar /></div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{r.workshopTitle || 'Workshop'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    by {r.artisanName || 'Artisan'}
                    {r.workshopDate && ` · ${formatDate(r.workshopDate)}`}
                    {r.workshopPrice && Number(r.workshopPrice) > 0 && ` · ${formatCurrency(r.workshopPrice)}`}
                  </p>
                  {r.registrationDate && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Registered {formatDate(r.registrationDate)}</p>
                  )}
                </div>
              </div>
              <Badge status={r.status}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
