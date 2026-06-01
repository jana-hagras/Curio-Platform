import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { paymentService } from '../../services/paymentService';
import { FiDollarSign, FiTrendingUp, FiClock, FiDownload, FiPercent } from 'react-icons/fi';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import DataTable from '../../components/ui/DataTable';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function WalletPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['dashboard']);
  const isRtl = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [wallet, setWallet] = useState({
    totalEarnings: 0,
    grossEarnings: 0,
    totalCommission: 0,
    pendingBalance: 0,
    transactions: []
  });

  useEffect(() => {
    setLoading(true);
    paymentService.getByArtisan(user.id)
      .then(res => {
        const payments = res.data?.payments || [];

        // Use DB-computed values
        const completedPayments = payments.filter(p => p.status === 'Completed');
        const pendingPayments = payments.filter(p => p.status === 'Pending');

        const grossEarnings = completedPayments.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
        const totalNet = completedPayments.reduce((sum, p) => sum + Number(p.artisanAmount || 0), 0);
        const totalCommission = completedPayments.reduce((sum, p) => sum + Number(p.platformCommissionAmount || 0), 0);
        const pendingBalance = pendingPayments.reduce((sum, p) => sum + Number(p.artisanAmount || p.totalAmount || 0), 0);

        // Build transactions from payments
        const transactions = payments.map(p => {
          let typeLabel = t('dashboard:wallet.typeSale', 'Sale');
          if (p.paymentType === 'workshop') typeLabel = t('dashboard:wallet.typeWorkshop', 'Workshop');
          else if (p.paymentType === 'mentorship') typeLabel = t('dashboard:wallet.typeMentorship', 'Mentorship');
          else if (p.paymentType === 'escrow') typeLabel = t('dashboard:wallet.typeCustom', 'Custom Request');
          else if (p.paymentType === 'product') typeLabel = t('dashboard:wallet.typeProductSale', 'Product Sale');

          return {
            id: `PMT-${p.id}`,
            date: p.transactionDate,
            type: `${typeLabel}${p.workshop_id ? ` #${p.workshop_id}` : (p.mentorship_id ? ` #${p.mentorship_id}` : (p.order_id ? ` · ${t('dashboard:orders.orderNum', 'Order #{{id}}', { id: p.order_id })}` : ''))}`,
            gross: Number(p.totalAmount || 0),
            commission: Number(p.platformCommissionAmount || 0),
            amount: Number(p.artisanAmount || 0),
            status: p.status,
            method: p.paymentMethod || '—',
          };
        });

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        setWallet({
          totalEarnings: totalNet,
          grossEarnings,
          totalCommission,
          pendingBalance,
          transactions
        });
      })
      .catch(() => toast.error(t('dashboard:wallet.failedLoad', "Failed to load wallet data")))
      .finally(() => setLoading(false));
  }, [user.id, t]);

  if (loading) return <DashboardSkeleton />;

  const handleWithdraw = () => {
    if (wallet.totalEarnings <= 0) {
      toast.error(t('dashboard:wallet.noFunds', 'No funds available to withdraw.'));
      return;
    }
    setIsWithdrawing(true);
    setTimeout(() => {
      toast.success(t('dashboard:portfolio.withdrawSuccess', { amount: formatCurrency(wallet.totalEarnings), defaultValue: `Successfully withdrew ${formatCurrency(wallet.totalEarnings)} to your bank account!` }));
      setWallet(prev => ({
        ...prev,
        totalEarnings: 0
      }));
      setIsWithdrawing(false);
    }, 1500);
  };

  const columns = [
    { header: t('dashboard:wallet.colRefId', 'Ref ID'), accessor: 'id' },
    { header: t('dashboard:wallet.colDate', 'Date'), accessor: 'date', render: r => r.date ? new Date(r.date).toLocaleDateString(i18n.language) : '—' },
    { header: t('dashboard:wallet.colDescription', 'Description'), accessor: 'type' },
    { header: t('dashboard:wallet.colGross', 'Gross'), accessor: 'gross', render: r => <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.gross)}</span> },
    { header: t('dashboard:wallet.colCommission', 'Commission (10%)'), accessor: 'commission', render: r => <span style={{ color: 'var(--error)', fontSize: 13 }}>-{formatCurrency(r.commission)}</span> },
    { header: t('dashboard:wallet.colNetAmount', 'Net Amount'), accessor: 'amount', render: r => <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(r.amount)}</span> },
    { header: t('dashboard:wallet.colMethod', 'Method'), accessor: 'method' },
    { header: t('dashboard:wallet.colStatus', 'Status'), accessor: 'status', render: r => <Badge status={r.status} /> }
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>{t('dashboard:wallet.title', 'My Wallet')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t('dashboard:wallet.subtitle', 'Track your earnings and pending payments')}</p>
        </div>
        <button 
          onClick={handleWithdraw}
          disabled={isWithdrawing || wallet.totalEarnings <= 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: wallet.totalEarnings <= 0 ? 'var(--surface-border)' : 'var(--gold-primary)', 
            color: wallet.totalEarnings <= 0 ? 'var(--text-tertiary)' : 'var(--black-deep)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 14,
            cursor: wallet.totalEarnings <= 0 ? 'not-allowed' : 'pointer',
            opacity: isWithdrawing ? 0.7 : 1
          }}>
          <FiDownload style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} /> {isWithdrawing ? t('dashboard:wallet.processing', 'Processing...') : t('dashboard:wallet.withdrawFunds', 'Withdraw Funds')}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiDollarSign />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{t('dashboard:wallet.netEarnings', 'Net Earnings')}</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(wallet.totalEarnings)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiTrendingUp />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{t('dashboard:wallet.grossRevenue', 'Gross Revenue')}</p>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(wallet.grossEarnings)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiPercent />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{t('dashboard:wallet.platformCommission', 'Platform Commission')}</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, color: 'var(--error)' }}>-{formatCurrency(wallet.totalCommission)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiClock />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{t('dashboard:wallet.pendingBalance', 'Pending Balance')}</p>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(wallet.pendingBalance)}</h3>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>{t('dashboard:wallet.transactionHistory', 'Transaction History')}</h3>
        <DataTable columns={columns} data={wallet.transactions} loading={loading} emptyMessage={t('dashboard:wallet.noTransactions', 'No transactions yet.')} />
      </div>
    </div>
  );
}
