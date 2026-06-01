import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiFileText, FiEdit2 } from 'react-icons/fi';
import InvoiceModal from '../../components/ui/InvoiceModal';
import EditOrderModal from '../../components/ui/EditOrderModal';
import { useTranslation } from 'react-i18next';

/** Returns true if the order was placed within the last 24 hours */
const isEditableOrder = (order) => {
  if (!order.orderDate) return false;
  const placed = new Date(order.orderDate);
  const now = new Date();
  const diffMs = now - placed;
  return diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000;
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filter, setFilter] = useState('All');
  const { t } = useTranslation(['order', 'common']);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderService.getByBuyer(user.id)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredAndSortedOrders = orders
    .filter(o => filter === 'All' || o.status === filter)
    .sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return -1;
      if (a.status !== 'Completed' && b.status === 'Completed') return 1;
      return new Date(b.orderDate) - new Date(a.orderDate);
    });

  const enrichedOrder = (r) => ({
    ...r,
    buyerName: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
  });

  const columns = [
    { header: t('order:orders.orderId', 'Order ID'), accessor: 'id' },
    { header: t('order:orders.date', 'Date'), accessor: 'orderDate', render: r => formatDate(r.orderDate) },
    { header: t('order:orders.total', 'Total'), accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount) },
    { header: t('order:orders.status', 'Status'), accessor: 'status', render: r => <Badge status={r.status} /> },
    {
      header: t('order:orders.actions', 'Actions'),
      accessor: 'actions',
      render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Invoice button — always visible */}
          <button
            onClick={() => setSelectedOrder(enrichedOrder(r))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            <FiFileText /> {t('order:orders.invoice', 'Invoice')}
          </button>

          {/* Edit button — visible only within 24 hours of placement */}
          {isEditableOrder(r) && (
            <button
              onClick={() => setEditingOrder(enrichedOrder(r))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: 'rgba(var(--gold-rgb, 212,175,55),0.1)',
                border: '1px solid rgba(var(--gold-rgb, 212,175,55),0.4)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                color: 'var(--gold-primary, #d4af37)',
              }}
            >
              <FiEdit2 /> {t('order:orders.edit', 'Edit')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{t('order:orders.title', 'My Orders')}</h1>
        <select
          className="select-field"
          style={{ width: 'auto', padding: '8px 16px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">{t('order:orders.all', 'All Orders')}</option>
          <option value="Completed">{t('common:status.Completed', 'Completed')}</option>
          <option value="Pending">{t('common:status.Pending', 'Pending')}</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAndSortedOrders}
        loading={loading}
        emptyMessage={t('order:orders.noOrders', "You haven't placed any orders yet.")}
      />

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
          onSaved={fetchOrders}
        />
      )}
    </div>
  );
}
