import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('All');

  useEffect(() => {
    orderService.getByBuyer(user.id)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const filteredAndSortedOrders = orders
    .filter(o => filter === 'All' || o.status === filter)
    .sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return -1;
      if (a.status !== 'Completed' && b.status === 'Completed') return 1;
      return new Date(b.orderDate) - new Date(a.orderDate);
    });

  const columns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Date', accessor: 'orderDate', render: r => formatDate(r.orderDate) },
    { header: 'Total', accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> },
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
    </div>
  );
}
