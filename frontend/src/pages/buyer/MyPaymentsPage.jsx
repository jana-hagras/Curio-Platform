import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { paymentService } from '../../services/paymentService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

import EmptyState from '../../components/ui/EmptyState';
import { FiDollarSign } from 'react-icons/fi';

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getByBuyer(user.id)
      .then(res => setPayments(res.data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Payment ID', accessor: 'id' },
    { header: 'Amount', accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount || 0) },
    { header: 'Method', accessor: 'paymentMethod', render: r => r.paymentMethod || '—' },
    { header: 'Date', accessor: 'transactionDate', render: r => formatDate(r.transactionDate) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> }
  ];

  const pendingPayments = payments.filter(p => p.status === 'Pending');

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Payments</h1>
      
      {pendingPayments.length > 0 && (
        <div style={{ padding: '16px 24px', background: 'var(--surface-secondary)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <h3 style={{ color: 'var(--error)', margin: '0 0 8px 0', fontSize: 16 }}>Action Required</h3>
          <p style={{ margin: 0, fontSize: 14 }}>You have {pendingPayments.length} pending payment(s) that require attention. Please complete these to process your orders.</p>
        </div>
      )}

      {!loading && payments.length === 0 ? (
        <EmptyState 
          icon={FiDollarSign} 
          title="No payment history found" 
          message="Transactions will appear here once you complete an order or fund a custom request milestone." 
        />
      ) : (
        <DataTable columns={columns} data={payments} loading={loading} />
      )}
    </div>
  );
}
