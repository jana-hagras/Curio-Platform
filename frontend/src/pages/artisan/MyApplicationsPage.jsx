import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { milestoneService } from '../../services/milestoneService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';
import { FiCheck, FiEdit3, FiChevronDown, FiChevronRight, FiChevronLeft, FiBriefcase, FiFileText, FiX, FiPrinter, FiTrash2, FiPlus, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import InvoiceModal from '../../components/ui/InvoiceModal';
import { useTranslation } from 'react-i18next';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['dashboard']);
  const isRtl = i18n.language === 'ar';

  const [apps, setApps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);
  const [milestones, setMilestones] = useState({});
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', escrowAmount: '', dueDate: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, milestoneId: null, requestId: null, type: 'milestone' });
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [addForm, setAddForm] = useState({ title: '', description: '', escrowAmount: '', dueDate: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);

  useEffect(() => {
    Promise.all([
      applicationService.getByArtisan(user.id).catch(() => ({ data: { applications: [] } })),
      orderService.getByArtisan(user.id).catch(() => ({ data: { orders: [] } }))
    ])
    .then(([aRes, oRes]) => {
      setApps(aRes.data?.applications || []);
      setOrders(oRes.data?.orders || []);
    })
    .catch(() => toast.error(t('dashboard:orders.failedLoad', 'Failed to load orders')))
    .finally(() => setLoading(false));
  }, [user.id, t]);

  const loadMilestones = async (requestId) => {
    try {
      const mRes = await milestoneService.getByRequest(requestId);
      setMilestones(prev => ({ ...prev, [requestId]: mRes.data?.milestones || [] }));
    } catch {
      setMilestones(prev => ({ ...prev, [requestId]: [] }));
    }
  };

  const toggleExpand = (app) => {
    if (expandedApp === app.id) {
      setExpandedApp(null);
    } else {
      setExpandedApp(app.id);
      if (!milestones[app.request_id]) loadMilestones(app.request_id);
    }
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone.id);
    setEditForm({
      title: milestone.title || '',
      description: milestone.description || '',
      escrowAmount: milestone.escrowAmount || '',
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : '',
    });
  };

  const handleSaveEdit = async (milestoneId, requestId) => {
    const payload = {};
    // Only include fields that have actual values — never send empty strings
    // as they would overwrite existing DB data (even with NULLIF on backend,
    // we want a clean payload to avoid accidental field clearing).
    if (editForm.title.trim())       payload.title = editForm.title.trim();
    if (editForm.description.trim()) payload.description = editForm.description.trim();
    if (editForm.escrowAmount !== '') payload.escrowAmount = Number(editForm.escrowAmount);
    if (editForm.dueDate)            payload.dueDate = editForm.dueDate;

    if (Object.keys(payload).length === 0) {
      toast.error(t('dashboard:orders.noChanges', 'No changes to save'));
      return;
    }

    try {
      await milestoneService.update(milestoneId, payload);
      await loadMilestones(requestId);
      setEditingMilestone(null);
      toast.success(t('dashboard:orders.milestoneUpdated', 'Milestone updated!'));
    } catch {
      toast.error(t('dashboard:orders.failedUpdateMilestone', 'Failed to update milestone'));
    }
  };

  const handleAddMilestone = async (requestId) => {
    if (!addForm.title.trim()) return toast.error(t('dashboard:orders.titleRequired', 'Title is required'));
    setAddingMilestone(true);
    try {
      await milestoneService.create({
        request_id: requestId,
        title: addForm.title,
        description: addForm.description,
        escrowAmount: addForm.escrowAmount ? Number(addForm.escrowAmount) : 0,
        dueDate: addForm.dueDate || null,
      });
      await loadMilestones(requestId);
      setAddForm({ title: '', description: '', escrowAmount: '', dueDate: '' });
      setShowAddForm(null);
      toast.success(t('dashboard:orders.milestoneAdded', 'Milestone added!'));
    } catch (err) {
      toast.error(err.message || t('dashboard:orders.failedAddMilestone', 'Failed to add milestone'));
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleDeleteMilestone = async () => {
    const { milestoneId, requestId, type } = confirmDialog;
    try {
      if (type === 'delete-milestone') {
        await milestoneService.delete(milestoneId);
        await loadMilestones(requestId);
        toast.success(t('dashboard:orders.milestoneDeleted', 'Milestone deleted!'));
      } else if (type === 'milestone') {
        await milestoneService.complete(milestoneId);
        await loadMilestones(requestId);
        toast.success(t('dashboard:orders.milestoneCompleted', 'Milestone completed! Escrow funds released.'));
      } else {
        await orderService.update(milestoneId, { status: 'Completed' });
        setOrders(prev => prev.map(o => o.id === milestoneId ? { ...o, status: 'Completed' } : o));
        toast.success(t('dashboard:orders.orderCompleted', 'Order marked as completed!'));
      }
    } catch (err) {
      toast.error(err.message || t('dashboard:orders.failedUpdate', 'Failed to update'));
    } finally {
      setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' });
    }
  };

  if (loading) return <Spinner />;

  const inputStyle = {
    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-border)', background: 'var(--surface-primary)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%',
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{t('dashboard:orders.title', 'My Orders')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t('dashboard:orders.subtitle', 'Manage your marketplace sales and custom project milestones')}</p>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--surface-border)' }}>
        <button onClick={() => setActiveTab('marketplace')}
          style={{ padding: '12px 4px', background: 'none', border: 'none',
            color: activeTab === 'marketplace' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'marketplace' ? '2px solid var(--gold-primary)' : '2px solid transparent',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('dashboard:orders.marketplaceSales', 'Marketplace Sales ({{count}})', { count: orders.length })}
        </button>
        <button onClick={() => setActiveTab('custom')}
          style={{ padding: '12px 4px', background: 'none', border: 'none',
            color: activeTab === 'custom' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'custom' ? '2px solid var(--gold-primary)' : '2px solid transparent',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          {t('dashboard:orders.customRequests', 'Custom Requests ({{count}})', { count: apps.length })}
        </button>
      </div>

      {activeTab === 'marketplace' ? (
        orders.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '80px 32px', textAlign: 'center' }}>
            <FiBriefcase style={{ fontSize: 56, color: 'var(--surface-border)', marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>{t('dashboard:orders.noSalesTitle', 'No sales yet')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t('dashboard:orders.noSalesSubtitle', 'Your marketplace orders will appear here')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212, 168, 67, 0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><FiFileText /></div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{t('dashboard:orders.orderNum', 'Order #{{id}}', { id: order.id })}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('dashboard:orders.buyerInfo', 'Buyer: {{name}} • {{date}}', { name: order.buyerName, date: formatDate(order.orderDate) })}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: isRtl ? 'left' : 'right', [isRtl ? 'marginLeft' : 'marginRight']: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold-primary)' }}>{formatCurrency(order.totalAmount)}</p>
                    <Badge status={order.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="ghost" icon={FiPrinter} onClick={() => setInvoiceOrder(order)}>{t('dashboard:orders.invoice', 'Invoice')}</Button>
                    {order.status !== 'Completed' && (
                      <Button size="sm" onClick={() => setConfirmDialog({ open: true, milestoneId: order.id, type: 'order' })}>{t('dashboard:orders.complete', 'Complete')}</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        apps.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '80px 32px', textAlign: 'center' }}>
            <FiBriefcase style={{ fontSize: 56, color: 'var(--surface-border)', marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>{t('dashboard:orders.noCustomTitle', 'No custom applications')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>{t('dashboard:orders.noCustomSubtitle', 'Browse requests to find craft opportunities')}</p>
            <Button onClick={() => navigate('/requests')}>{t('dashboard:orders.browseRequests', 'Browse Requests')}</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {apps.map(app => {
              const isExpanded = expandedApp === app.id;
              const reqMilestones = milestones[app.request_id] || [];
              const isApproved = app.status === 'Approved';
              const completedCount = reqMilestones.filter(m => m.status === 'Completed').length;
              const totalCount = reqMilestones.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div key={app.id} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden', transition: 'all 0.2s' }}>
                  {/* Application Header */}
                  <div onClick={() => toggleExpand(app)}
                    style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid var(--surface-border)' : 'none', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {isExpanded ? <FiChevronDown style={{ color: 'var(--gold-primary)', fontSize: 18 }} /> : (isRtl ? <FiChevronLeft style={{ color: 'var(--text-tertiary)', fontSize: 18 }} /> : <FiChevronRight style={{ color: 'var(--text-tertiary)', fontSize: 18 }} />)}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{t('dashboard:orders.requestNum', 'Request #{{id}}', { id: app.request_id })}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.proposal?.slice(0, 80) || t('dashboard:orders.proposalSubmitted', 'Proposal submitted')}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(app.applicationDate)}</span>
                      <Badge status={app.status} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ padding: '20px 24px' }}>
                      {/* Proposal Detail */}
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard:orders.yourProposal', 'Your Proposal')}</h4>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--surface-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                          {app.proposal || t('dashboard:orders.noProposal', 'No proposal text')}
                        </p>
                      </div>

                      {/* Milestones */}
                      {isApproved && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {t('dashboard:orders.projectMilestones', 'Project Milestones')}
                            </h4>
                            <Button size="sm" variant="ghost" icon={FiPlus} onClick={() => setShowAddForm(showAddForm === app.request_id ? null : app.request_id)}>
                              {t('dashboard:orders.addMilestone', 'Add Milestone')}
                            </Button>
                          </div>

                          {/* Progress Bar */}
                          {totalCount > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                <span>{t('dashboard:orders.milestonesCompleted', '{{completed}} of {{total}} milestones completed', { completed: completedCount, total: totalCount })}</span>
                                <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>{progress}%</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-tertiary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--gold-primary), #10B981)', width: `${progress}%`, transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )}

                          {/* Add Milestone Form */}
                          {showAddForm === app.request_id && (
                            <div style={{ background: 'var(--surface-secondary)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid var(--surface-border)' }}>
                              <h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>{t('dashboard:orders.newMilestone', 'New Milestone')}</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                <input value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.milestoneTitle', 'Milestone title *')} />
                                <input value={addForm.escrowAmount} onChange={e => setAddForm({ ...addForm, escrowAmount: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.escrowAmount', 'Escrow amount ($)')} type="number" min="0" step="0.01" />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                <input value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.description', 'Description')} />
                                <input value={addForm.dueDate} onChange={e => setAddForm({ ...addForm, dueDate: e.target.value })} style={inputStyle} type="date" />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Button size="sm" onClick={() => handleAddMilestone(app.request_id)} loading={addingMilestone} icon={FiPlus}>{t('dashboard:orders.add', 'Add')}</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(null); setAddForm({ title: '', description: '', escrowAmount: '', dueDate: '' }); }}>{t('dashboard:orders.cancel', 'Cancel')}</Button>
                              </div>
                            </div>
                          )}

                          {reqMilestones.length === 0 ? (
                            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{t('dashboard:orders.noMilestonesYet', 'No milestones yet. Click "Add Milestone" to create one.')}</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                              {/* Vertical timeline line */}
                              <div style={{ position: 'absolute', [isRtl ? 'right' : 'left']: 17, top: 18, bottom: 18, width: 2, background: 'var(--surface-border)', zIndex: 0 }} />

                              {reqMilestones.map((m, i) => (
                                <div key={m.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0', position: 'relative', zIndex: 1 }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: m.status === 'Completed' ? 'var(--success)' : 'var(--surface-primary)',
                                    color: m.status === 'Completed' ? '#fff' : 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700,
                                    border: m.status === 'Completed' ? 'none' : '2px solid var(--surface-border)',
                                  }}>
                                    {m.status === 'Completed' ? <FiCheck /> : i + 1}
                                  </div>
                                  <div style={{ flex: 1, background: 'var(--surface-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: m.status === 'Completed' ? '1px solid var(--success)' : '1px solid var(--surface-border)' }}>
                                    {editingMilestone === m.id ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                          <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.milestoneTitle', 'Milestone title *')} />
                                          <input value={editForm.escrowAmount} onChange={e => setEditForm({ ...editForm, escrowAmount: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.escrowAmount', 'Escrow amount ($)')} type="number" min="0" step="0.01" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                          <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={inputStyle} placeholder={t('dashboard:orders.description', 'Description')} />
                                          <input value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} style={inputStyle} type="date" />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <Button size="sm" onClick={() => handleSaveEdit(m.id, app.request_id)}>{t('dashboard:orders.save', 'Save')}</Button>
                                          <Button size="sm" variant="ghost" onClick={() => setEditingMilestone(null)}>{t('dashboard:orders.cancel', 'Cancel')}</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                          <p style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</p>
                                          <Badge status={m.status} />
                                        </div>
                                        {m.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{m.description}</p>}
                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiCalendar size={11} /> {formatDate(m.dueDate)}</span>
                                          {m.escrowAmount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold-primary)', fontWeight: 600 }}><FiDollarSign size={11} /> {formatCurrency(m.escrowAmount)}</span>}
                                        </div>
                                        {m.status !== 'Completed' && (
                                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                            <Button size="sm" variant="ghost" onClick={() => handleEditMilestone(m)} icon={FiEdit3}>{t('dashboard:orders.edit', 'Edit')}</Button>
                                            <Button size="sm" onClick={() => setConfirmDialog({ open: true, milestoneId: m.id, requestId: app.request_id, type: 'milestone' })} icon={FiCheck}>{t('dashboard:orders.complete', 'Complete')}</Button>
                                            <button onClick={() => setConfirmDialog({ open: true, milestoneId: m.id, requestId: app.request_id, type: 'delete-milestone' })}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}
                                              onMouseOver={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                                              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}>
                                              <FiTrash2 size={11} /> {t('dashboard:orders.delete', 'Delete')}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)'
        }} onClick={() => setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' })}>
          <div style={{
            background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32,
            maxWidth: 400, width: '90%', animation: 'scaleIn 0.2s ease',
            border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xl)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 12 }}>
              {confirmDialog.type === 'delete-milestone' ? t('dashboard:orders.confirmDeleteTitle', 'Delete Milestone') : t('dashboard:orders.confirmCompleteTitle', 'Confirm Completion')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {confirmDialog.type === 'delete-milestone'
                ? t('dashboard:orders.confirmDeleteText', 'Are you sure you want to delete this milestone? This action cannot be undone and will recalculate escrow amounts.')
                : t('dashboard:orders.confirmCompleteText', 'Are you sure you want to mark this {{type}} as completed? This will finalize the status for both you and the buyer.', { type: confirmDialog.type })}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' })}>{t('dashboard:orders.cancel', 'Cancel')}</Button>
              {confirmDialog.type === 'delete-milestone'
                ? <button onClick={handleDeleteMilestone} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('dashboard:orders.deleteMilestoneBtn', 'Delete Milestone')}</button>
                : <Button onClick={handleDeleteMilestone}>{t('dashboard:orders.confirmCompleteBtn', 'Confirm Completion')}</Button>}
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Receipt Modal */}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
}
