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

  useEffect(() => {
    orderService.getByBuyer(user.id)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Date', accessor: 'orderDate', render: r => formatDate(r.orderDate) },
    { header: 'Total', accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Orders</h1>
      <DataTable columns={columns} data={orders} loading={loading} emptyMessage="You haven't placed any orders yet." />
    </div>
  );
}
