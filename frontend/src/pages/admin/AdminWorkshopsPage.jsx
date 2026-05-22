import { useState, useEffect } from 'react';
import { workshopService } from '../../services/workshopService';
import { workshopRegistrationService } from '../../services/workshopRegistrationService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiSearch, FiCalendar, FiUsers, FiTrash2 } from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import toast from 'react-hot-toast';

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('workshops');

  const loadData = () => {
    Promise.all([
      workshopService.getAll(),
      workshopRegistrationService.getAll(),
    ]).then(([wRes, rRes]) => {
      setWorkshops(wRes.data?.workshops || []);
      setRegistrations(rRes.data?.registrations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteWorkshop = async (id) => {
    if (!confirm('Delete?')) return;
    try { await workshopService.delete(id); toast.success('Deleted'); loadData(); } catch (err) { toast.error(err.message); }
  };

  const handleDeleteReg = async (id) => {
    if (!confirm('Delete?')) return;
    try { await workshopRegistrationService.delete(id); toast.success('Deleted'); loadData(); } catch (err) { toast.error(err.message); }
  };

  if (loading) return <DashboardSkeleton />;

  const filteredWorkshops = search
    ? workshops.filter(w => `${w.title} ${w.artisanName} ${w.category}`.toLowerCase().includes(search.toLowerCase()))
    : workshops;

  const filteredRegs = search
    ? registrations.filter(r => `${r.buyerName} ${r.workshopTitle} ${r.artisanName}`.toLowerCase().includes(search.toLowerCase()))
    : registrations;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Workshop Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Workshops', value: workshops.length, icon: FiCalendar, color: '#D4A843' },
          { label: 'Upcoming', value: workshops.filter(w => w.status === 'Upcoming').length, icon: FiCalendar, color: '#3B82F6' },
          { label: 'Registrations', value: registrations.length, icon: FiUsers, color: '#10B981' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', padding: 18, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><s.icon /></div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.label}</p>
              <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-secondary)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {['workshops', 'registrations'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'var(--surface-primary)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: '8px 12px 8px 34px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, width: 220 }} />
        </div>
      </div>

      {tab === 'workshops' && (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
              {['ID', 'Title', 'Host', 'Category', 'Date', 'Price', 'Capacity', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredWorkshops.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{w.id}</td>
                  <td style={{ padding: '12px 16px' }}>{w.title || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{w.artisanName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{w.category || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{w.workshopDate ? formatDate(w.workshopDate) : '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold-primary)', fontWeight: 600 }}>{Number(w.price) > 0 ? formatCurrency(w.price) : 'Free'}</td>
                  <td style={{ padding: '12px 16px' }}>{w.registrationCount}/{w.maxParticipants}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={w.status}>{w.status}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDeleteWorkshop(w.id)} style={{ color: 'var(--error)', padding: 6, borderRadius: 6 }}><FiTrash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {filteredWorkshops.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No workshops found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'registrations' && (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
              {['ID', 'Buyer', 'Workshop', 'Host', 'Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredRegs.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{r.id}</td>
                  <td style={{ padding: '12px 16px' }}>{r.buyerName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{r.workshopTitle || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{r.artisanName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{r.registrationDate ? formatDate(r.registrationDate) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={r.status}>{r.status}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDeleteReg(r.id)} style={{ color: 'var(--error)', padding: 6, borderRadius: 6 }}><FiTrash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {filteredRegs.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No registrations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
