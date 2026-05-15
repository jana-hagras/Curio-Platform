import { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FiSearch, FiX, FiInbox, FiEye, FiTrash2, FiChevronDown,
  FiUser, FiMapPin, FiCalendar, FiPackage, FiPhone, FiMessageSquare,
  FiCreditCard, FiDollarSign,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

/* ── Status Badge ────────────────────────────── */
function StatusBadge({ status, type = 'order' }) {
  const map = {
    Pending: 'badge-yellow', Completed: 'badge-green', Failed: 'badge-red',
  };
  return <span className={`admin-badge ${map[status] || 'badge-blue'}`}>{status || '—'}</span>;
}

/* ── Detail Modal ────────────────────────────── */
function DetailModal({ order: o, onClose, onDelete }) {
  if (!o) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 580, width: '95%', maxHeight: '85vh', overflow: 'auto', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Order #{o.id}</h2>
            <StatusBadge status={o.status} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>
        <div style={{ padding: '24px 28px' }}>
          {/* Buyer + Payment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FiUser size={11} /> Buyer</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{o.buyerName || '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID #{o.buyer_id}</p>
            </div>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FiCreditCard size={11} /> Payment</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(o.totalAmount)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{o.paymentMethod || '—'} · <StatusBadge status={o.paymentStatus} /></p>
            </div>
          </div>
          {/* Address */}
          <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={11} /> Delivery Details</div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{o.deliveryAddress || 'No address provided'}</p>
            {o.phone && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}><FiPhone size={10} /> {o.phone}</p>}
            {o.deliveryNotes && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiMessageSquare size={10} /> {o.deliveryNotes}</p>}
          </div>
          {/* Meta + Delete */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
              <FiCalendar size={13} />
              {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
            <button onClick={() => onDelete(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              <FiTrash2 size={13} /> Delete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Delete Modal ────────────────────── */
function ConfirmDeleteModal({ orderId, onConfirm, onCancel }) {
  if (!orderId) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, width: '90%', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Delete Order #{orderId}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          This will permanently delete the order, its items, and associated payment records. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(orderId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Delete Order</button>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────── */
function Skeleton() {
  return (
    <div className="admin-loading-skeleton">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          {[40, 120, 80, 150, 80, 70, 80, 50].map((w, j) => (
            <div key={j} className="admin-skeleton-cell" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getAll();
        setOrders(res.data?.orders || []);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id) => {
    try {
      await orderService.delete(id);
      toast.success('Order deleted');
      setOrders(prev => prev.filter(o => o.id !== id));
      setConfirmDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Failed to delete order'); }
  };

  const requestDelete = (id) => {
    setSelected(null);
    setConfirmDeleteId(id);
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [o.id, o.buyerName, o.status, o.totalAmount, o.deliveryAddress, o.phone, o.paymentMethod, o.paymentStatus, o.orderDate]
        .some(v => String(v ?? '').toLowerCase().includes(q));
    });
  }, [orders, search, filterStatus]);

  const total = orders.length;
  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Completed').length;
  const revenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const hasFilters = search || filterStatus !== 'all';

  return (
    <div className="admin-table-page">
      {/* Header */}
      <div className="admin-table-header">
        <div>
          <h1>Orders</h1>
          <p className="admin-table-count">{loading ? 'Loading…' : `${filtered.length} of ${total} orders`}</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" size={14} />
          <input placeholder="Search buyer, address, status, payment…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><FiX size={13} /></button>}
        </div>
      </div>

      {/* Stats */}
      <div className="admin-mini-stats">
        <div className="admin-mini-stat" onClick={() => setFilterStatus('all')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'all' ? '2px solid var(--gold-primary)' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Total</p>
          <p className="admin-mini-stat-value" style={{ color: 'var(--gold-primary)' }}>{total}</p>
        </div>
        <div className="admin-mini-stat" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'Pending' ? '2px solid #F59E0B' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Pending</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>{pending}</p>
        </div>
        <div className="admin-mini-stat" onClick={() => setFilterStatus('Completed')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'Completed' ? '2px solid #10B981' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Completed</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{completed}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Revenue</p>
          <p className="admin-mini-stat-value" style={{ color: 'var(--gold-primary)' }}>{formatCurrency(revenue)}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>Filter:</span>
        <div style={{ position: 'relative' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ appearance: 'none', padding: '7px 30px 7px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            <option value="all">All Statuses</option>
            <option value="Pending">⏳ Pending</option>
            <option value="Completed">✅ Completed</option>
          </select>
          <FiChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
        </div>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
            <FiX size={11} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <FiInbox size={44} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{hasFilters ? 'No matching orders' : 'No orders yet'}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{hasFilters ? 'Try adjusting your search or filters.' : 'Orders will appear here when buyers make purchases.'}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Buyer</th>
                <th>Date</th>
                <th>Address</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer' }}>
                  <td className="admin-cell-id">#{o.id}</td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{o.buyerName || '—'}</span>
                      <span className="admin-cell-stack-secondary">ID #{o.buyer_id}</span>
                    </div>
                  </td>
                  <td className="admin-cell-secondary">
                    {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {o.deliveryAddress || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No address</span>}
                      </span>
                      {o.phone && <span className="admin-cell-stack-secondary">{o.phone}</span>}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{o.paymentMethod || '—'}</span>
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="View" onClick={e => { e.stopPropagation(); setSelected(o); }} className="admin-action-btn"><FiEye size={13} /></button>
                      <button title="Delete" onClick={e => { e.stopPropagation(); requestDelete(o.id); }} className="admin-action-btn danger"><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <DetailModal order={selected} onClose={() => setSelected(null)} onDelete={requestDelete} />}
      <ConfirmDeleteModal orderId={confirmDeleteId} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
