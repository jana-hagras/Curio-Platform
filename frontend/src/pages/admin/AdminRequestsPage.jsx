import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2, FiRefreshCw, FiCpu, FiImage, FiAlertCircle, FiCheckCircle, FiLoader, FiChevronDown, FiChevronUp, FiStar, FiLayers } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [versionData, setVersionData] = useState({});
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
      setTimeout(() => fetchRequests(), 2000);
    } catch { toast.error('Failed to start regeneration'); }
    finally {
      setRegeneratingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!versionData[id]) {
      try {
        const res = await requestService.getVersions(id);
        setVersionData(prev => ({ ...prev, [id]: res.data?.versions || [] }));
      } catch { toast.error('Failed to load versions'); }
    }
  };

  const isReady = !loading && lookupReady;

  const enriched = requests.map(r => ({
    ...r,
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

  const renderVersionDrawer = (r) => {
    const versions = versionData[r.id];
    if (!versions) return (
      <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center' }}>
        <FiLoader size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
      </td></tr>
    );
    if (!versions.length) return (
      <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        No AI generations found for this request.
      </td></tr>
    );
    return (
      <tr>
        <td colSpan={9} style={{ padding: 0 }}>
          <div style={{
            background: 'var(--surface-secondary)', padding: '20px 24px',
            borderTop: '1px solid var(--surface-border)',
            animation: 'fadeInUp 0.25s ease',
          }}>
            {/* Original description */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Original Description</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>{r.description || '—'}</p>
            </div>

            {/* Versions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {versions.map(v => (
                <div key={v.versionNumber} style={{
                  background: 'var(--surface-primary)', borderRadius: 'var(--radius-md)',
                  border: v.isPreferred ? '2px solid var(--gold-primary)' : '1px solid var(--surface-border)',
                  padding: 16, position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      <FiLayers size={12} style={{ marginRight: 4 }} />Version {v.versionNumber}
                    </span>
                    {v.isPreferred && (
                      <span className="admin-badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <FiStar size={10} /> Preferred
                      </span>
                    )}
                    <span className={`admin-badge ${v.status === 'Completed' ? 'badge-green' : v.status === 'Failed' ? 'badge-red' : 'badge-yellow'}`}>{v.status}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{formatDate(v.createdAt)}</span>
                  </div>

                  {v.refinementPrompt && (
                    <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(139,92,246,0.06)', borderRadius: 8, borderLeft: '3px solid #8B5CF6' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' }}>Refinement</span>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{v.refinementPrompt}</p>
                    </div>
                  )}

                  {v.enhancedPrompt && (
                    <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(212,168,67,0.06)', borderRadius: 8, borderLeft: '3px solid var(--gold-primary)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase' }}>Enhanced Prompt</span>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.5 }}>{v.enhancedPrompt}</p>
                    </div>
                  )}

                  {v.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {v.images.map((url, i) => (
                        <img key={i} src={url} alt={`v${v.versionNumber}-${i}`}
                          style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--surface-border)' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-table-page">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .admin-ai-thumb { width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--surface-border); }
        .admin-ai-thumb-stack { display: flex; gap: 4px; align-items: center; }
        .admin-ai-count { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
        .admin-action-btn.regen:hover { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        .admin-action-btn.regen.spinning svg { animation: spin 1s linear infinite; }
        .admin-expand-btn { background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
        .admin-expand-btn:hover { color: var(--gold-primary); }
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
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(r.id)}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {aiStatusBadge(r.aiStatus)}
                        {r.versionCount > 1 && (
                          <span className="admin-badge badge-purple" style={{ fontSize: 10 }}>
                            <FiLayers size={9} style={{ marginRight: 2 }} />v{r.versionCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.aiImages && r.aiImages.length > 0 ? (
                        <div className="admin-ai-thumb-stack">
                          <img
                            src={r.preferredImage || r.aiImages[0]}
                            alt="AI preview"
                            className="admin-ai-thumb"
                            style={r.preferredImage ? { border: '2px solid var(--gold-primary)' } : {}}
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
                      <div className="admin-actions" onClick={e => e.stopPropagation()}>
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
                    <td>
                      <button className="admin-expand-btn" title="Show generation history">
                        {expandedId === r.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && renderVersionDrawer(r)}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
