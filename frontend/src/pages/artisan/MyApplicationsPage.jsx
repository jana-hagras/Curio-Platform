import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { milestoneService } from '../../services/milestoneService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatDate';
import { FiCheck, FiEdit3, FiChevronDown, FiChevronRight, FiBriefcase, FiFileText, FiX, FiPrinter } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'custom'
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);
  const [milestones, setMilestones] = useState({});
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, milestoneId: null, requestId: null, type: 'milestone' });
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  useEffect(() => {
    Promise.all([
      applicationService.getByArtisan(user.id).catch(() => ({ data: { applications: [] } })),
      orderService.getByArtisan(user.id).catch(() => ({ data: { orders: [] } }))
    ])
    .then(([aRes, oRes]) => {
      setApps(aRes.data?.applications || []);
      setOrders(oRes.data?.orders || []);
    })
    .catch(() => toast.error('Failed to load orders'))
    .finally(() => setLoading(false));
  }, [user.id]);

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
      if (!milestones[app.request_id]) {
        loadMilestones(app.request_id);
      }
    }
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone.id);
    setEditForm({ title: milestone.title || '', description: milestone.description || '' });
  };

  const handleSaveEdit = async (milestoneId, requestId) => {
    try {
      await milestoneService.update(milestoneId, editForm);
      setMilestones(prev => ({
        ...prev,
        [requestId]: prev[requestId].map(m =>
          m.id === milestoneId ? { ...m, ...editForm } : m
        ),
      }));
      setEditingMilestone(null);
      toast.success('Milestone updated!');
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const handleMarkCompleted = async () => {
    const { milestoneId, requestId, type } = confirmDialog;
    try {
      if (type === 'milestone') {
        await milestoneService.update(milestoneId, { status: 'Completed' });
        setMilestones(prev => ({
          ...prev,
          [requestId]: prev[requestId].map(m =>
            m.id === milestoneId ? { ...m, status: 'Completed' } : m
          ),
        }));
        toast.success('Milestone marked as completed!');
      } else {
        await orderService.update(milestoneId, { status: 'Completed' });
        setOrders(prev => prev.map(o => o.id === milestoneId ? { ...o, status: 'Completed' } : o));
        toast.success('Order marked as completed!');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' });
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Orders</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage your marketplace sales and custom project milestones</p>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--surface-border)' }}>
        <button 
          onClick={() => setActiveTab('marketplace')}
          style={{ 
            padding: '12px 4px', background: 'none', border: 'none', 
            color: activeTab === 'marketplace' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'marketplace' ? '2px solid var(--gold-primary)' : '2px solid transparent',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Marketplace Sales ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab('custom')}
          style={{ 
            padding: '12px 4px', background: 'none', border: 'none', 
            color: activeTab === 'custom' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'custom' ? '2px solid var(--gold-primary)' : '2px solid transparent',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Custom Requests ({apps.length})
        </button>
      </div>

      {activeTab === 'marketplace' ? (
        orders.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '80px 32px', textAlign: 'center' }}>
            <FiBriefcase style={{ fontSize: 56, color: 'var(--surface-border)', marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>No sales yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Your marketplace orders will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} style={{
                background: 'var(--surface-primary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212, 168, 67, 0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    <FiFileText />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Order #{order.id}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Buyer: {order.buyerName} • {formatDate(order.orderDate)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold-primary)' }}>{formatCurrency(order.totalAmount)}</p>
                    <Badge status={order.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="ghost" icon={FiPrinter} onClick={() => setInvoiceOrder(order)}>Invoice</Button>
                    {order.status !== 'Completed' && (
                      <Button size="sm" onClick={() => setConfirmDialog({ open: true, milestoneId: order.id, type: 'order' })}>Complete</Button>
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
            <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>No custom applications</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>Browse requests to find craft opportunities</p>
            <Button onClick={() => navigate('/requests')}>Browse Requests</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {apps.map(app => {
              const isExpanded = expandedApp === app.id;
              const reqMilestones = milestones[app.request_id] || [];
              const isApproved = app.status === 'Approved';

              return (
                <div key={app.id} style={{
                  background: 'var(--surface-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border)',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}>
                  {/* Application Header */}
                  <div
                    onClick={() => toggleExpand(app)}
                    style={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: isExpanded ? '1px solid var(--surface-border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {isExpanded ? <FiChevronDown style={{ color: 'var(--gold-primary)', fontSize: 18 }} /> : <FiChevronRight style={{ color: 'var(--text-tertiary)', fontSize: 18 }} />}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                          Request #{app.request_id}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.proposal?.slice(0, 80) || 'Proposal submitted'}
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
                        <h4 style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Proposal</h4>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--surface-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                          {app.proposal || 'No proposal text'}
                        </p>
                      </div>

                      {/* Milestones */}
                      {isApproved && (
                        <div>
                          <h4 style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Milestones</h4>
                          {reqMilestones.length === 0 ? (
                            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No milestones generated yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {reqMilestones.map((m, i) => (
                                <div key={m.id || i} style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 16,
                                  padding: '16px',
                                  background: 'var(--surface-secondary)',
                                  borderRadius: 'var(--radius-md)',
                                  border: m.status === 'Completed' ? '1px solid var(--success)' : '1px solid var(--surface-border)',
                                }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: m.status === 'Completed' ? 'var(--success)' : 'var(--surface-tertiary)',
                                    color: m.status === 'Completed' ? '#fff' : 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                                  }}>
                                    {m.status === 'Completed' ? <FiCheck /> : i + 1}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    {editingMilestone === m.id ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input
                                          value={editForm.title}
                                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                          style={{
                                            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--surface-border)', background: 'var(--surface-primary)',
                                            color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                                          }}
                                          placeholder="Milestone title"
                                        />
                                        <input
                                          value={editForm.description}
                                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                          style={{
                                            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--surface-border)', background: 'var(--surface-primary)',
                                            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                          }}
                                          placeholder="Description"
                                        />
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <Button size="sm" onClick={() => handleSaveEdit(m.id, app.request_id)}>Save</Button>
                                          <Button size="sm" variant="ghost" onClick={() => setEditingMilestone(null)}>Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <p style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</p>
                                          <Badge status={m.status} />
                                        </div>
                                        {m.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{m.description}</p>}
                                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Due: {formatDate(m.dueDate)}</p>
                                        {m.status !== 'Completed' && (
                                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                            <Button size="sm" variant="ghost" onClick={() => handleEditMilestone(m)} icon={FiEdit3}>Edit</Button>
                                            <Button size="sm" onClick={() => setConfirmDialog({ open: true, milestoneId: m.id, requestId: app.request_id, type: 'milestone' })} icon={FiCheck}>Mark Completed</Button>
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

      {/* Confirm Dialog with fixed z-index */}
      {confirmDialog.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, // Static high z-index fix
          animation: 'fadeIn 0.2s ease',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' })}>
          <div style={{
            background: 'var(--surface-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
            maxWidth: 400,
            width: '90%',
            animation: 'scaleIn 0.2s ease',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-xl)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 12 }}>Confirm Completion</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to mark this {confirmDialog.type} as completed? This will finalize the status for both you and the buyer.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmDialog({ open: false, milestoneId: null, requestId: null, type: 'milestone' })}>Cancel</Button>
              <Button onClick={handleMarkCompleted}>Confirm Completion</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Receipt Modal */}
      {invoiceOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }} onClick={() => setInvoiceOrder(null)}>
          <div style={{
            background: '#fff',
            color: '#111',
            borderRadius: 'var(--radius-lg)',
            padding: 40,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            fontFamily: 'Courier, monospace',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setInvoiceOrder(null)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 24 }}
            >
              <FiX />
            </button>
            
            <div style={{ borderBottom: '2px solid #eee', paddingBottom: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>INVOICE</h1>
                <p style={{ margin: '4px 0', opacity: 0.7 }}>Order #{invoiceOrder.id}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: 'var(--gold-primary)' }}>CURIO</h2>
                <p style={{ margin: 0, fontSize: 12 }}>Marketplace for Artisans</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 12, marginBottom: 10, borderBottom: '1px solid #eee' }}>Artisan Details</h4>
                <p style={{ fontWeight: 700, margin: 0 }}>{user.firstName} {user.lastName}</p>
                <p style={{ margin: 0, fontSize: 14 }}>{user.email}</p>
                <p style={{ margin: 0, fontSize: 14 }}>{user.address || 'Cairo, Egypt'}</p>
              </div>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 12, marginBottom: 10, borderBottom: '1px solid #eee' }}>Buyer Details</h4>
                <p style={{ fontWeight: 700, margin: 0 }}>{invoiceOrder.buyerName}</p>
                <p style={{ margin: 0, fontSize: 14 }}>{invoiceOrder.deliveryAddress || 'N/A'}</p>
                <p style={{ margin: 0, fontSize: 14 }}>Date: {formatDate(invoiceOrder.orderDate)}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #111' }}>
                  <th style={{ padding: '10px 0' }}>Description</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '20px 0' }}>
                    <p style={{ fontWeight: 700, margin: 0 }}>Order Content</p>
                    <p style={{ fontSize: 12, margin: 0, opacity: 0.6 }}>Artisan handmade product from marketplace</p>
                  </td>
                  <td style={{ padding: '20px 0', textAlign: 'right', fontWeight: 700 }}>
                    {formatCurrency(invoiceOrder.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'right', borderTop: '2px solid #111', paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 10 }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceOrder.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, fontSize: 24, fontWeight: 900 }}>
                <span>TOTAL:</span>
                <span style={{ color: 'var(--gold-primary)' }}>{formatCurrency(invoiceOrder.totalAmount)}</span>
              </div>
            </div>

            <div style={{ marginTop: 60, textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
              <p>Thank you for supporting authentic Egyptian craftsmanship.</p>
              <p>This is a computer generated invoice.</p>
            </div>

            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
               <Button icon={FiPrinter} onClick={() => window.print()}>Print Invoice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
