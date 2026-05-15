import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiFileText, FiEdit3, FiX, FiMapPin, FiPhone, FiMessageSquare } from 'react-icons/fi';
import InvoiceModal from '../../components/ui/InvoiceModal';
import toast from 'react-hot-toast';

/* ── Edit Order Modal ────────────────────────── */
function EditOrderModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({
    deliveryAddress: order.deliveryAddress || '',
    phone: order.phone || '',
    deliveryNotes: order.deliveryNotes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deliveryAddress.trim()) return toast.error('Address is required');
    setSaving(true);
    try {
      await onSave(order.id, form);
      onClose();
    } catch { /* handled by parent */ }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 520, width: '95%', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Order #{order.id}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#F59E0B' }}>
            Only pending orders can be edited. Changes to address and delivery details.
          </div>
          <Input label="Shipping Address *" value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Full delivery address" required icon={FiMapPin} />
          <div style={{ marginTop: 16 }}>
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Contact phone number" icon={FiPhone} />
          </div>
          <div style={{ marginTop: 16 }}>
            <TextArea label="Delivery Notes" value={form.deliveryNotes} onChange={e => setForm({ ...form, deliveryNotes: e.target.value })} placeholder="Special instructions, gate codes, etc." rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchOrders = () => {
    setLoading(true);
    orderService.getByBuyer(user.id)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [user.id]);

  const handleEditSave = async (orderId, data) => {
    try {
      const res = await orderService.update(orderId, { ...data, buyer_id: user.id });
      const updated = res.data?.order;
      if (updated) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      toast.success('Order updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order');
      throw err;
    }
  };

  const filteredAndSortedOrders = orders
    .filter(o => filter === 'All' || o.status === filter)
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const columns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Date', accessor: 'orderDate', render: r => formatDate(r.orderDate) },
    { header: 'Address', accessor: 'deliveryAddress', render: r => (
      <span style={{ fontSize: 13, color: r.deliveryAddress ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
        {r.deliveryAddress || '—'}
      </span>
    )},
    { header: 'Total', accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> },
    { header: 'Actions', accessor: 'actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {r.status === 'Pending' && (
          <button onClick={() => setEditingOrder(r)} title="Edit order"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--surface-secondary)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <FiEdit3 size={12} /> Edit
          </button>
        )}
        <button
          onClick={() => setSelectedOrder({ ...r, buyerName: user.firstName + (user.lastName ? ' ' + user.lastName : '') })}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--surface-secondary)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          <FiFileText size={12} /> Invoice
        </button>
      </div>
    )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Orders</h1>
        <select
          className="select-field"
          style={{ width: 'auto', padding: '8px 16px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Orders</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      <DataTable columns={columns} data={filteredAndSortedOrders} loading={loading} emptyMessage="You haven't placed any orders yet." />

      {selectedOrder && (
        <InvoiceModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
