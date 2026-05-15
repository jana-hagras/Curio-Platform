import { useState, useEffect } from 'react';
import { portfolioService } from '../../services/portfolioService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminPortfoliosPage() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await portfolioService.getAll();
        setProjects(res.data?.projects || []);
      } catch { toast.error('Failed to load portfolio projects'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete portfolio project "${name}"? This will remove all associated gallery images.`)) return;
    try {
      await portfolioService.delete(id);
      toast.success('Portfolio project removed');
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Failed to delete portfolio project'); }
  };

  const isReady = !loading && lookupReady;

  const enriched = projects.map(p => ({
    ...p,
    // Backend already provides artisanName from JOIN; fall back to lookup only if null
    artisanName: p.artisanName || userName(p.artisan_id || p.artisanId),
    artisanId: p.artisan_id ?? p.artisanId,
  }));

  const filtered = filterByAllColumns(enriched, search, p =>
    `${p.id} ${p.projectName} ${p.description || ''} ${p.artisanName}`
  );

  const artisans = [...new Set(projects.map(p => p.artisanName || p.artisan_id).filter(Boolean))];

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 180 }} />
          <div className="admin-skeleton-cell" style={{ width: 240 }} />
          <div className="admin-skeleton-cell" style={{ width: 140 }} />
          <div className="admin-skeleton-cell" style={{ width: 40 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <div className="admin-table-header">
        <div>
          <h1>Portfolio Projects</h1>
          <p className="admin-table-count">{projects.length} projects · {artisans.length} artisans · Search by name, description, artisan</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Projects</p>
          <p className="admin-mini-stat-value">{projects.length}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Artisans with Portfolios</p>
          <p className="admin-mini-stat-value" style={{ color: '#8B5CF6' }}>{artisans.length}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Avg per Artisan</p>
          <p className="admin-mini-stat-value" style={{ color: '#D4A843' }}>
            {artisans.length ? (projects.length / artisans.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty">
            <FiBriefcase style={{ fontSize: 40, color: 'var(--text-secondary)', marginBottom: 12 }} />
            <p>No portfolio projects found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Description</th>
                <th>Artisan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{p.projectName || '—'}</span>
                      <span className="admin-cell-stack-secondary">ID #{p.id}</span>
                    </div>
                  </td>
                  <td className="admin-cell-secondary admin-cell-truncate">
                    {p.description || '—'}
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{p.artisanName}</span>
                      <span className="admin-cell-stack-secondary">ID #{p.artisanId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn danger"
                        title="Remove project"
                        onClick={() => handleDelete(p.id, p.projectName)}
                      >
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
