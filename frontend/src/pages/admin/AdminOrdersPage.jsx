import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getAll();
        setOrders(res.data?.orders || []);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoading(false); }
    })();
  }, []);

  const isReady = !loading && lookupReady;

  const enriched = orders.map(o => ({
    ...o,
    // Backend already provides buyerName from JOIN; fall back to lookup only if null
    buyerName: o.buyerName || userName(o.buyer_id || o.buyerId),
    buyerId: o.buyer_id ?? o.buyerId,
  }));

  const filtered = filterByAllColumns(enriched, search, o =>
    `${o.id} ${o.buyerName} ${o.status} ${o.totalAmount} ${o.deliveryAddress || ''} ${o.orderDate || ''}`
  );

  const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const completed = orders.filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const total = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  const statusBadge = (status) => {
    const map = { Completed: 'badge-green', Pending: 'badge-yellow', Failed: 'badge-red' };
    return <span className={`admin-badge ${map[status] || 'badge-blue'}`}>{status}</span>;
  };

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 40 }} />
          <div className="admin-skeleton-cell" style={{ width: 130 }} />
          <div className="admin-skeleton-cell" style={{ width: 90 }} />
          <div className="admin-skeleton-cell" style={{ width: 80 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 160 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <div className="admin-table-header">
        <div>
          <h1>Orders</h1>
          <p className="admin-table-count">{orders.length} orders · Search by buyer, status, amount, address</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Pending</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>{pending}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Completed</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{completed}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Revenue</p>
          <p className="admin-mini-stat-value" style={{ color: '#D4A843' }}>{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty"><p>No orders found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Delivery Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="admin-cell-id">#{o.id}</td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{o.buyerName}</span>
                      <span className="admin-cell-stack-secondary">ID #{o.buyerId}</span>
                    </div>
                  </td>
                  <td className="admin-cell-secondary">
                    {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="admin-cell-primary">{formatCurrency(o.totalAmount)}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td className="admin-cell-secondary admin-cell-truncate">
                    {o.deliveryAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
