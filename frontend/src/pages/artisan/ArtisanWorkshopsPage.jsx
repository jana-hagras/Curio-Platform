import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { workshopService } from '../../services/workshopService';
import { workshopRegistrationService } from '../../services/workshopRegistrationService';
import { CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import toast from 'react-hot-toast';

export default function ArtisanWorkshopsPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', workshopDate: '', duration: '120', price: '', category: '', maxParticipants: '20', status: 'Upcoming' });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      workshopService.getByArtisan(user.id),
      workshopRegistrationService.getByArtisan(user.id),
    ]).then(([wRes, rRes]) => {
      setWorkshops(wRes.data?.workshops || []);
      setRegistrations(rRes.data?.registrations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user.id]);

  const resetForm = () => setForm({ title: '', description: '', workshopDate: '', duration: '120', price: '', category: '', maxParticipants: '20', status: 'Upcoming' });

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = { ...form, duration: Number(form.duration), price: Number(form.price || 0), maxParticipants: Number(form.maxParticipants) };
      if (editingId) {
        await workshopService.update(editingId, payload);
        toast.success('Workshop updated');
      } else {
        await workshopService.create({ ...payload, artisan_id: user.id });
        toast.success('Workshop created');
      }
      setShowModal(false); setEditingId(null); resetForm(); loadData();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workshop?')) return;
    try { await workshopService.delete(id); toast.success('Deleted'); loadData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleEdit = (w) => {
    setForm({ title: w.title || '', description: w.description || '', workshopDate: w.workshopDate ? new Date(w.workshopDate).toISOString().slice(0, 10) : '', duration: w.duration || '120', price: w.price || '', category: w.category || '', maxParticipants: w.maxParticipants || '20', status: w.status || 'Upcoming' });
    setEditingId(w.id); setShowModal(true);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Workshops</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Host and manage craft workshops</p>
        </div>
        <Button icon={FiPlus} onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>New Workshop</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Workshops', value: workshops.length, icon: FiCalendar, color: '#D4A843' },
          { label: 'Upcoming', value: workshops.filter(w => w.status === 'Upcoming').length, icon: FiCalendar, color: '#3B82F6' },
          { label: 'Total Registrations', value: registrations.filter(r => r.status !== 'Cancelled').length, icon: FiUsers, color: '#10B981' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><s.icon /></div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 2 }}>{s.label}</p>
              <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Workshop List */}
      {workshops.length === 0 ? (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}><FiCalendar /></div>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', marginBottom: 8 }}>No Workshops Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Host your first workshop to share your craft skills</p>
          <Button icon={FiPlus} onClick={() => setShowModal(true)}>Create Workshop</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {workshops.map(w => {
            const regs = registrations.filter(r => r.workshop_id === w.id);
            const isExpanded = expandedId === w.id;
            return (
              <div key={w.id} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}><FiCalendar /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 15 }}>{w.title}</p>
                        <Badge status={w.status}>{w.status}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {w.workshopDate ? formatDate(w.workshopDate) : 'No date set'} · {Number(w.price) > 0 ? formatCurrency(w.price) : 'Free'} · {regs.length}/{w.maxParticipants} registered
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); handleEdit(w); }} style={{ padding: 8, borderRadius: 8, color: 'var(--text-secondary)' }}><FiEdit2 size={16} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(w.id); }} style={{ padding: 8, borderRadius: 8, color: 'var(--error)' }}><FiTrash2 size={16} /></button>
                    {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--surface-border)' }}>
                    {regs.length === 0 ? (
                      <p style={{ padding: 24, color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>No registrations yet</p>
                    ) : regs.map(r => (
                      <div key={r.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, color: 'var(--gold-primary)' }}>{r.buyerName?.charAt(0) || 'B'}</div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14 }}>{r.buyerName || 'Buyer'}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Registered {r.registrationDate ? formatDate(r.registrationDate) : ''}</p>
                          </div>
                        </div>
                        <Badge status={r.status}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); resetForm(); }} title={editingId ? 'Edit Workshop' : 'Create Workshop'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Pottery" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Date</label>
              <input type="date" value={form.workshopDate} onChange={e => setForm({ ...form, workshopDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Price ($)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0 = Free" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Max Participants</label>
              <input type="number" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe what participants will learn..." style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? 'Update' : 'Create'} Workshop</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
