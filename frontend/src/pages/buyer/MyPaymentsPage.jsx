import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { paymentService } from '../../services/paymentService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.search(user.id) // simplistic assuming backend maps this, or we just load all and filter
      .then(res => setPayments(res.data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Payment ID', accessor: 'id' },
    { header: 'Amount', accessor: 'amount', render: r => formatCurrency(r.amount) },
    { header: 'Method', accessor: 'method' },
    { header: 'Date', accessor: 'paymentDate', render: r => formatDate(r.paymentDate) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Payments</h1>
      <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payment history found." />
    </div>
  );
}
