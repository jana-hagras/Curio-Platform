import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { mentorshipService } from '../../services/mentorshipService';
import { mentorshipApplicationService } from '../../services/mentorshipApplicationService';
import { CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
  FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock, FiCheckCircle,
  FiXCircle, FiBookOpen, FiChevronDown, FiChevronUp, FiLink, FiCalendar
} from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import toast from 'react-hot-toast';

export default function ArtisanMentorshipsPage() {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ category: '', sessionPrice: '', duration: '60', description: '', maxStudents: '10', startDate: '', status: 'Active' });
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    Promise.all([
      mentorshipService.getByArtisan(user.id),
      mentorshipApplicationService.getByArtisan(user.id),
    ]).then(([mRes, aRes]) => {
      setMentorships(mRes.data?.mentorships || []);
      setApplications(aRes.data?.applications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user.id]);

  const resetForm = () => setForm({ category: '', sessionPrice: '', duration: '60', description: '', maxStudents: '10', startDate: '', status: 'Active' });

  const handleSave = async () => {
    if (!form.sessionPrice || !form.duration) return toast.error('Price and duration are required');
    setSaving(true);
    try {
      if (editingId) {
        await mentorshipService.update(editingId, { ...form, sessionPrice: Number(form.sessionPrice), duration: Number(form.duration), maxStudents: Number(form.maxStudents) });
        toast.success('Mentorship updated');
      } else {
        await mentorshipService.create({ ...form, artisan_id: user.id, sessionPrice: Number(form.sessionPrice), duration: Number(form.duration), maxStudents: Number(form.maxStudents) });
        toast.success('Mentorship created');
      }
      setShowCreateModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mentorship? All applications will be removed.')) return;
    try {
      await mentorshipService.delete(id);
      toast.success('Mentorship deleted');
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  const handleEdit = (m) => {
    setForm({
      category: m.category || '', sessionPrice: m.sessionPrice || '', duration: m.duration || '60',
      description: m.description || '', maxStudents: m.maxStudents || '10',
      startDate: m.startDate ? new Date(m.startDate).toISOString().slice(0, 10) : '', status: m.status || 'Active',
    });
    setEditingId(m.id);
    setShowCreateModal(true);
  };

  const handleApplicationAction = async (appId, status, meetingLink, scheduledAt) => {
    try {
      await mentorshipApplicationService.update(appId, { status, meetingLink, scheduledAt });
      toast.success(`Application ${status.toLowerCase()}`);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  if (loading) return <DashboardSkeleton />;

  const getAppsForMentorship = (mId) => applications.filter(a => a.mentorship_id === mId);

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Mentorships</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Create and manage your mentorship offerings</p>
        </div>
        <Button icon={FiPlus} onClick={() => { resetForm(); setEditingId(null); setShowCreateModal(true); }}>
          New Mentorship
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Offerings', value: mentorships.length, icon: FiBookOpen, color: '#D4A843' },
          { label: 'Active', value: mentorships.filter(m => m.status === 'Active').length, icon: FiCheckCircle, color: '#10B981' },
          { label: 'Total Applications', value: applications.length, icon: FiUsers, color: '#3B82F6' },
          { label: 'Accepted Students', value: applications.filter(a => a.status === 'Accepted').length, icon: FiCheckCircle, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface-primary)', padding: 20, borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <s.icon />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 2 }}>{s.label}</p>
              <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Mentorship List */}
      {mentorships.length === 0 ? (
        <div style={{
          background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)',
          padding: '60px 24px', textAlign: 'center',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
            <FiBookOpen />
          </div>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', marginBottom: 8 }}>No Mentorships Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Create your first mentorship offering to start teaching</p>
          <Button icon={FiPlus} onClick={() => setShowCreateModal(true)}>Create Mentorship</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mentorships.map(m => {
            const apps = getAppsForMentorship(m.id);
            const isExpanded = expandedId === m.id;

            return (
              <div key={m.id} style={{
                background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)', overflow: 'hidden',
              }}>
                {/* Mentorship Header */}
                <div style={{
                  padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }} onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      <FiBookOpen />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 15 }}>{m.category || 'General Mentorship'}</p>
                        <Badge status={m.status}>{m.status}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatCurrency(m.sessionPrice)}/session · {m.duration}min · {apps.length} application{apps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); handleEdit(m); }} style={{ padding: 8, borderRadius: 8, color: 'var(--text-secondary)' }} title="Edit">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{ padding: 8, borderRadius: 8, color: 'var(--error)' }} title="Delete">
                      <FiTrash2 size={16} />
                    </button>
                    {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded: Applications */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--surface-border)' }}>
                    {apps.length === 0 ? (
                      <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>No applications yet</p>
                    ) : (
                      apps.map(app => (
                        <div key={app.id} style={{
                          padding: '16px 24px', borderBottom: '1px solid var(--surface-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-tertiary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: 'var(--gold-primary)',
                            }}>
                              {app.buyerName?.charAt(0) || 'B'}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14 }}>{app.buyerName || 'Buyer'}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                Applied {app.applicationDate ? formatDate(app.applicationDate) : 'recently'}
                                {app.message && ` · "${app.message.slice(0, 50)}${app.message.length > 50 ? '...' : ''}"`}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Badge status={app.status}>{app.status}</Badge>
                            {app.status === 'Pending' && (
                              <>
                                <Button size="sm" onClick={() => handleApplicationAction(app.id, 'Accepted')}>
                                  <FiCheckCircle size={14} style={{ marginRight: 4 }} /> Accept
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleApplicationAction(app.id, 'Rejected')}>
                                  <FiXCircle size={14} style={{ marginRight: 4 }} /> Reject
                                </Button>
                              </>
                            )}
                            {app.status === 'Accepted' && !app.meetingLink && (
                              <Button size="sm" variant="outline" onClick={() => {
                                const link = prompt('Enter meeting link (Zoom, Google Meet, etc.):');
                                if (link) handleApplicationAction(app.id, 'Accepted', link);
                              }}>
                                <FiLink size={14} style={{ marginRight: 4 }} /> Add Meeting Link
                              </Button>
                            )}
                            {app.meetingLink && (
                              <a href={app.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--gold-primary)', fontWeight: 600 }}>
                                <FiLink size={13} /> Meeting Link
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingId(null); resetForm(); }} title={editingId ? 'Edit Mentorship' : 'Create Mentorship'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Session Price ($) *</label>
              <input type="number" value={form.sessionPrice} onChange={e => setForm({ ...form, sessionPrice: e.target.value })} placeholder="e.g. 50" style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Duration (min) *</label>
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Max Students</label>
              <input type="number" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe what students will learn, your experience, and teaching approach..." style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setEditingId(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? 'Update' : 'Create'} Mentorship</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
