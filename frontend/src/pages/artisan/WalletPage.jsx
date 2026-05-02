import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import { milestoneService } from '../../services/milestoneService';
import { applicationService } from '../../services/applicationService';
import { FiDollarSign, FiTrendingUp, FiClock, FiDownload } from 'react-icons/fi';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import DataTable from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    totalEarnings: 0,
    pendingBalance: 0,
    withdrawableBalance: 0,
    transactions: []
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      orderService.getByArtisan(user.id).catch(() => ({ data: { orders: [] } })),
      applicationService.getByArtisan(user.id).catch(() => ({ data: { applications: [] } })),
    ]).then(async ([oRes, aRes]) => {
      const artisanOrders = oRes.data?.orders || [];
      const apps = aRes.data?.applications || [];

      // Marketplace orders revenue
      const completedOrders = artisanOrders.filter(o => o.status === 'Completed');
      const pendingOrders = artisanOrders.filter(o => o.status === 'Pending');

      const orderRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const pendingOrderRevenue = pendingOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      let totalMilestoneReleased = 0;
      let totalMilestonePending = 0;
      let transactions = [];

      // Orders Transactions
      artisanOrders.forEach(o => {
        transactions.push({
          id: `ORD-${o.id}`,
          date: o.orderDate,
          type: `Sale: Order #${o.id}`,
          amount: o.totalAmount,
          status: o.status
        });
      });

      // Milestones for Approved Apps
      const approvedApps = apps.filter(a => a.status === 'Approved');
      
      for (const app of approvedApps) {
        try {
          const mRes = await milestoneService.getByRequest(app.request_id);
          const milestones = mRes.data?.milestones || [];
          
          milestones.forEach(m => {
            if (m.status === 'Released' || m.status === 'Completed') {
              totalMilestoneReleased += Number(m.escrowAmount || 0);
              transactions.push({
                id: `MIL-${m.id}`,
                date: m.dueDate,
                type: `Milestone: ${m.title}`,
                amount: m.escrowAmount,
                status: 'Completed'
              });
            } else {
              totalMilestonePending += Number(m.escrowAmount || 0);
              transactions.push({
                id: `MIL-${m.id}`,
                date: m.dueDate,
                type: `Milestone: ${m.title} (Pending)`,
                amount: m.escrowAmount,
                status: 'Pending'
              });
            }
          });
        } catch (err) {
          console.error("Milestone fetch error", err);
        }
      }

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setWallet({
        totalEarnings: orderRevenue + totalMilestoneReleased,
        pendingBalance: pendingOrderRevenue + totalMilestonePending,
        withdrawableBalance: orderRevenue + totalMilestoneReleased,
        transactions
      });
    })
    .catch(() => toast.error("Failed to load wallet data"))
    .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <DashboardSkeleton />;

  const columns = [
    { header: 'Ref ID', accessor: 'id' },
    { header: 'Date', accessor: 'date', render: r => new Date(r.date).toLocaleDateString() },
    { header: 'Description', accessor: 'type' },
    { header: 'Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600 }}>{formatCurrency(r.amount)}</span> },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> }
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Wallet</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Track your earnings and pending payments</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--gold-primary)', color: 'var(--black-deep)',
          border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-md)',
          fontWeight: 600, fontSize: 14, cursor: 'pointer'
        }}>
          <FiDownload /> Withdraw Funds
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiTrendingUp />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Total Earnings</p>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(wallet.totalEarnings)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiClock />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Pending Balance</p>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(wallet.pendingBalance)}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            <FiDollarSign />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Withdrawable</p>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(wallet.withdrawableBalance)}</h3>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>Transaction History</h3>
        <DataTable columns={columns} data={wallet.transactions} loading={loading} emptyMessage="No transactions yet." />
      </div>
    </div>
  );
}
