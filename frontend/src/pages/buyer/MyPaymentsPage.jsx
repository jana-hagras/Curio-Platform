import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { paymentService } from '../../services/paymentService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import EmptyState from '../../components/ui/EmptyState';
import { FiDollarSign, FiLock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation(['order', 'common']);

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    paymentService.getByBuyer(user.id)
      .then(res => setPayments(res.data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: t('order:payments.paymentId', 'Payment ID'), accessor: 'id' },
    { header: t('order:payments.type', 'Type'), accessor: 'paymentType', render: r => (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 4, 
        padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        background: r.paymentType === 'escrow' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        color: r.paymentType === 'escrow' ? '#3B82F6' : '#10B981'
      }}>
        {r.paymentType === 'escrow' ? <><FiLock size={10} /> {t('order:payments.escrowType', 'Escrow')}</> : '🛍 ' + t('order:payments.productType', 'Product')}
      </span>
    )},
    { header: t('order:payments.amount', 'Amount'), accessor: 'totalAmount', render: r => formatCurrency(r.totalAmount || 0) },
    { header: t('order:payments.method', 'Method'), accessor: 'paymentMethod', render: r => r.paymentMethod || '—' },
    { header: t('order:payments.date', 'Date'), accessor: 'transactionDate', render: r => formatDate(r.transactionDate) },
    { header: t('order:payments.status', 'Status'), accessor: 'status', render: r => <Badge status={r.status} /> },
    { header: t('order:payments.escrow', 'Escrow'), accessor: 'escrowStatus', render: r => {
      if (r.paymentType !== 'escrow') return <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>;
      const colors = { pending: '#F59E0B', held: '#3B82F6', partially_released: '#8B5CF6', fully_released: '#10B981', refunded: '#EF4444' };
      return (
        <span style={{ fontSize: 12, fontWeight: 600, color: colors[r.escrowStatus] || 'var(--text-tertiary)' }}>
          {t('order:payments.escrowLabels.' + r.escrowStatus, r.escrowStatus) || '—'}
        </span>
      );
    }},
  ];

  const pendingEscrow = payments.filter(p => p.paymentType === 'escrow' && p.status === 'Pending');
  const pendingPayments = payments.filter(p => p.status === 'Pending' && p.paymentType !== 'escrow');

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('order:payments.title', 'My Payments')}</h1>
      
      {/* Pending escrow payments that need checkout */}
      {pendingEscrow.length > 0 && (
        <div style={{ padding: '16px 24px', background: 'rgba(59, 130, 246, 0.06)', [isRtl ? 'borderRight' : 'borderLeft']: '4px solid #3B82F6', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <h3 style={{ color: '#3B82F6', margin: '0 0 8px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock size={16} /> {t('order:payments.pendingEscrowTitle', 'Escrow Payments Pending')}
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('order:payments.pendingEscrowDesc', { count: pendingEscrow.length })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pendingEscrow.map(p => (
              <Button 
                key={p.id} 
                size="sm" 
                onClick={() => navigate(`/checkout?payment_id=${p.id}&request_id=${p.request_id}`)}
              >
                {t('order:payments.payAmountForRequest', { amount: formatCurrency(p.totalAmount), requestId: p.request_id })}
              </Button>
            ))}
          </div>
        </div>
      )}

      {pendingPayments.length > 0 && (
        <div style={{ padding: '16px 24px', background: 'var(--surface-secondary)', [isRtl ? 'borderRight' : 'borderLeft']: '4px solid var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <h3 style={{ color: 'var(--error)', margin: '0 0 8px 0', fontSize: 16 }}>{t('order:payments.actionRequired', 'Action Required')}</h3>
          <p style={{ margin: 0, fontSize: 14 }}>{t('order:payments.pendingPaymentsDesc', { count: pendingPayments.length })}</p>
        </div>
      )}

      {!loading && payments.length === 0 ? (
        <EmptyState 
          icon={FiDollarSign} 
          title={t('order:payments.noHistoryTitle', 'No payment history found')} 
          message={t('order:payments.noHistoryDesc', 'Transactions will appear here once you complete an order or fund a custom request milestone.')} 
        />
      ) : (
        <DataTable columns={columns} data={payments} loading={loading} />
      )}
    </div>
  );
}
