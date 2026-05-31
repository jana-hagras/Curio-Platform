import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2, FiRefreshCw, FiCpu, FiImage, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const { userName, loaded: lookupReady } = useAdminData();

  const fetchRequests = async () => {
    try {
      const res = await requestService.getAll();
      setRequests(res.data?.requests || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await requestService.delete(id);
      toast.success('Request removed');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('Failed to delete request'); }
  };

  const handleRegenerate = async (id) => {
    setRegeneratingIds(prev => new Set(prev).add(id));
    try {
      await requestService.regenerate(id);
      toast.success('AI regeneration started');
      // Refresh the list to pick up updated status
      setTimeout(() => fetchRequests(), 2000);
    } catch {
      toast.error('Failed to start regeneration');
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const isReady = !loading && lookupReady;

  const enriched = requests.map(r => ({
    ...r,
    // Backend already provides buyerName from JOIN; fall back to lookup only if null
    buyerName: r.buyerName || userName(r.buyer_id || r.buyerId),
    buyerId: r.buyer_id ?? r.buyerId,
  }));

  const filtered = filterByAllColumns(enriched, search, r =>
    `${r.id} ${r.title} ${r.category} ${r.budget} ${r.status || 'Open'} ${r.buyerName} ${r.description || ''} ${r.aiStatus || ''}`
  );

  const open = requests.filter(r => !r.status || r.status === 'Open').length;
  const inProgress = requests.filter(r => r.status === 'In Progress').length;
  const totalBudget = requests.reduce((s, r) => s + Number(r.budget || 0), 0);
  const aiCompleted = requests.filter(r => r.aiStatus === 'Completed').length;
  const aiFailed = requests.filter(r => r.aiStatus === 'Failed').length;

  const statusBadge = (status) => {
    const map = { Open: 'badge-green', Closed: 'badge-red', 'In Progress': 'badge-yellow' };
    return <span className={`admin-badge ${map[status] || 'badge-green'}`}>{status || 'Open'}</span>;
  };

  const aiStatusBadge = (aiStatus) => {
    const map = {
      Completed: { cls: 'badge-green', icon: <FiCheckCircle size={11} /> },
      Processing: { cls: 'badge-yellow', icon: <FiLoader size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
      Failed: { cls: 'badge-red', icon: <FiAlertCircle size={11} /> },
      Pending: { cls: 'badge-blue', icon: <FiCpu size={11} /> },
      None: { cls: 'badge-gray', icon: null },
    };
    const entry = map[aiStatus] || map.None;
    return (
      <span className={`admin-badge ${entry.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {entry.icon}
        {aiStatus || 'None'}
      </span>
    );
  };

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 160 }} />
          <div className="admin-skeleton-cell" style={{ width: 80 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 80 }} />
          <div className="admin-skeleton-cell" style={{ width: 50 }} />
          <div className="admin-skeleton-cell" style={{ width: 120 }} />
          <div className="admin-skeleton-cell" style={{ width: 40 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .admin-prompt-cell { max-width: 200px; font-size: 12px; color: var(--text-secondary); cursor: pointer; }
        .admin-prompt-cell-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
        .admin-prompt-cell-text.expanded { -webkit-line-clamp: unset; display: block; }
        .admin-prompt-cell-text:hover { color: var(--text-primary); }
        .admin-ai-thumb { width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--surface-border); }
        .admin-ai-thumb-stack { display: flex; gap: 4px; align-items: center; }
        .admin-ai-count { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
        .admin-action-btn.regen { }
        .admin-action-btn.regen:hover { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        .admin-action-btn.regen.spinning svg { animation: spin 1s linear infinite; }
      `}</style>

      <div className="admin-table-header">
        <div>
          <h1>Requests</h1>
          <p className="admin-table-count">{requests.length} custom requests · AI pipeline monitoring</p>
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
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">AI Completed</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{aiCompleted}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">AI Failed</p>
          <p className="admin-mini-stat-value" style={{ color: '#EF4444' }}>{aiFailed}</p>
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
                <th>AI Status</th>
                <th>AI Preview</th>
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
                  <td>{aiStatusBadge(r.aiStatus)}</td>
                  <td>
                    {r.aiImages && r.aiImages.length > 0 ? (
                      <div className="admin-ai-thumb-stack">
                        <img
                          src={r.aiImages[0]}
                          alt="AI preview"
                          className="admin-ai-thumb"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {r.aiImages.length > 1 && (
                          <span className="admin-ai-count">+{r.aiImages.length - 1}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {(r.aiStatus === 'Failed' || r.aiStatus === 'None') && (
                        <button
                          className={`admin-action-btn regen ${regeneratingIds.has(r.id) ? 'spinning' : ''}`}
                          title="Regenerate AI"
                          onClick={() => handleRegenerate(r.id)}
                          disabled={regeneratingIds.has(r.id)}
                        >
                          <FiRefreshCw />
                        </button>
                      )}
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
