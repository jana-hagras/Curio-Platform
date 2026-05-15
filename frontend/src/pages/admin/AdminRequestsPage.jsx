import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await requestService.getAll();
        setRequests(res.data?.requests || []);
      } catch { toast.error('Failed to load requests'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await requestService.delete(id);
      toast.success('Request removed');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('Failed to delete request'); }
  };

  const isReady = !loading && lookupReady;

  const enriched = requests.map(r => ({
    ...r,
    // Backend already provides buyerName from JOIN; fall back to lookup only if null
    buyerName: r.buyerName || userName(r.buyer_id || r.buyerId),
    buyerId: r.buyer_id ?? r.buyerId,
  }));

  const filtered = filterByAllColumns(enriched, search, r =>
    `${r.id} ${r.title} ${r.category} ${r.budget} ${r.status || 'Open'} ${r.buyerName} ${r.description || ''}`
  );

  const open = requests.filter(r => !r.status || r.status === 'Open').length;
  const inProgress = requests.filter(r => r.status === 'In Progress').length;
  const totalBudget = requests.reduce((s, r) => s + Number(r.budget || 0), 0);

  const statusBadge = (status) => {
    const map = { Open: 'badge-green', Closed: 'badge-red', 'In Progress': 'badge-yellow' };
    return <span className={`admin-badge ${map[status] || 'badge-green'}`}>{status || 'Open'}</span>;
  };

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 160 }} />
          <div className="admin-skeleton-cell" style={{ width: 80 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 120 }} />
          <div className="admin-skeleton-cell" style={{ width: 40 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <div className="admin-table-header">
        <div>
          <h1>Requests</h1>
          <p className="admin-table-count">{requests.length} custom requests · Search by title, buyer, category, budget, status</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Open</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{open}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">In Progress</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>{inProgress}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Budget</p>
          <p className="admin-mini-stat-value" style={{ color: '#D4A843' }}>{formatCurrency(totalBudget)}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty"><p>No requests found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Buyer</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.title}</span>
                      <span className="admin-cell-stack-secondary">ID #{r.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.buyerName}</span>
                      <span className="admin-cell-stack-secondary">ID #{r.buyerId}</span>
                    </div>
                  </td>
                  <td><span className="admin-badge badge-purple">{r.category || '—'}</span></td>
                  <td className="admin-cell-primary">{formatCurrency(r.budget)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn danger" title="Remove" onClick={() => handleDelete(r.id, r.title)}>
                        <FiTrash2 />
                      </button>
                    </div>
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
