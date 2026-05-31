import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiPlus, FiCheckCircle, FiLoader, FiAlertCircle, FiCpu, FiImage } from 'react-icons/fi';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestService.getByBuyer(user.id)
      .then(res => setRequests(res.data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const aiStatusBadge = (row) => {
    const status = row.aiStatus || 'None';
    const map = {
      Completed: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <FiCheckCircle size={12} />, label: 'Done' },
      Processing: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <FiLoader size={12} style={{ animation: 'spin 1s linear infinite' }} />, label: 'Generating' },
      Failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <FiAlertCircle size={12} />, label: 'Failed' },
      Pending: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: <FiCpu size={12} />, label: 'Pending' },
      None: { color: 'var(--text-tertiary)', bg: 'var(--surface-secondary)', icon: null, label: '—' },
    };
    const entry = map[status] || map.None;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 999, fontSize: 11,
        fontWeight: 600, color: entry.color, background: entry.bg,
        textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap',
      }}>
        {entry.icon}
        {entry.label}
      </span>
    );
  };

  const aiThumbnail = (row) => {
    if (row.aiImages && row.aiImages.length > 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img
            src={row.aiImages[0]}
            alt="AI preview"
            style={{
              width: 36, height: 36, borderRadius: 6,
              objectFit: 'cover', border: '1px solid var(--surface-border)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          {row.aiImages.length > 1 && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              +{row.aiImages.length - 1}
            </span>
          )}
        </div>
      );
    }
    return <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>;
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Category', accessor: 'category', render: r => <Badge status="Active">{r.category}</Badge> },
    { header: 'Budget', accessor: 'budget', render: r => formatCurrency(r.budget) },
    { header: 'Date', accessor: 'requestDate', render: r => formatDate(r.requestDate) },
    { header: 'AI Status', accessor: 'aiStatus', render: aiStatusBadge },
    { header: 'AI Preview', render: aiThumbnail },
    { header: 'Action', render: r => <Button size="sm" variant="outline" onClick={() => navigate(`/requests/${r.id}`)}>View</Button> }
  ];

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Requests</h1>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/requests/new')}>New Request</Button>
      </div>
      <DataTable columns={columns} data={requests} loading={loading} emptyMessage="You have no custom requests." />
    </div>
  );
}
