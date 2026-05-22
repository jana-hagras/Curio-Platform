import { useState, useEffect } from 'react';
import { mentorshipService } from '../../services/mentorshipService';
import { mentorshipApplicationService } from '../../services/mentorshipApplicationService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiSearch, FiBookOpen, FiUsers, FiCheckCircle, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import toast from 'react-hot-toast';

export default function AdminMentorshipsPage() {
  const [mentorships, setMentorships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('mentorships');

  const loadData = () => {
    Promise.all([
      mentorshipService.getAll(),
      mentorshipApplicationService.getAll(),
    ]).then(([mRes, aRes]) => {
      setMentorships(mRes.data?.mentorships || []);
      setApplications(aRes.data?.applications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteMentorship = async (id) => {
    if (!confirm('Delete this mentorship?')) return;
    try { await mentorshipService.delete(id); toast.success('Deleted'); loadData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleDeleteApp = async (id) => {
    if (!confirm('Delete this application?')) return;
    try { await mentorshipApplicationService.delete(id); toast.success('Deleted'); loadData(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <DashboardSkeleton />;

  const filteredMentorships = search
    ? mentorships.filter(m => `${m.artisanName} ${m.category} ${m.description}`.toLowerCase().includes(search.toLowerCase()))
    : mentorships;

  const filteredApps = search
    ? applications.filter(a => `${a.buyerName} ${a.artisanName} ${a.mentorshipCategory} ${a.status}`.toLowerCase().includes(search.toLowerCase()))
    : applications;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Mentorship Management</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Mentorships', value: mentorships.length, icon: FiBookOpen, color: '#D4A843' },
          { label: 'Active', value: mentorships.filter(m => m.status === 'Active').length, icon: FiCheckCircle, color: '#10B981' },
          { label: 'Applications', value: applications.length, icon: FiUsers, color: '#3B82F6' },
          { label: 'Accepted', value: applications.filter(a => a.status === 'Accepted' || a.status === 'Completed').length, icon: FiCheckCircle, color: '#8B5CF6' },
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

      {/* Tabs + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-secondary)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {['mentorships', 'applications'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'var(--surface-primary)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: '8px 12px 8px 34px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 13, width: 220 }} />
        </div>
      </div>

      {/* Mentorships Table */}
      {tab === 'mentorships' && (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
              {['ID', 'Artisan', 'Category', 'Price', 'Duration', 'Students', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredMentorships.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{m.id}</td>
                  <td style={{ padding: '12px 16px' }}>{m.artisanName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{m.category || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold-primary)', fontWeight: 600 }}>{formatCurrency(m.sessionPrice)}</td>
                  <td style={{ padding: '12px 16px' }}>{m.duration}min</td>
                  <td style={{ padding: '12px 16px' }}>{m.applicationCount}/{m.maxStudents}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={m.status}>{m.status}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDeleteMentorship(m.id)} style={{ color: 'var(--error)', padding: 6, borderRadius: 6 }}><FiTrash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {filteredMentorships.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No mentorships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Table */}
      {tab === 'applications' && (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
              {['ID', 'Buyer', 'Artisan', 'Category', 'Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredApps.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{a.id}</td>
                  <td style={{ padding: '12px 16px' }}>{a.buyerName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{a.artisanName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{a.mentorshipCategory || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{a.applicationDate ? formatDate(a.applicationDate) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={a.status}>{a.status}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDeleteApp(a.id)} style={{ color: 'var(--error)', padding: 6, borderRadius: 6 }}><FiTrash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No applications found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
