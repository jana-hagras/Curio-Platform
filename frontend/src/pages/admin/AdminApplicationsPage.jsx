import { useState, useEffect } from 'react';
import { applicationService } from '../../services/applicationService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, requestTitle, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await applicationService.search('');
        setApplications(res.data?.applications || []);
      } catch { setApplications([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const isReady = !loading && lookupReady;

  const enriched = applications.map(a => ({
    ...a,
    // Backend already provides artisanName from JOIN; fall back to lookup only if null
    artisanName: a.artisanName || userName(a.artisan_id || a.artisanId),
    requestName: requestTitle(a.request_id ?? a.requestId),
    artisanId: a.artisan_id ?? a.artisanId,
    requestId: a.request_id ?? a.requestId,
  }));

  const filtered = filterByAllColumns(enriched, search, a =>
    `${a.id} ${a.artisanName} ${a.requestName} ${a.status || 'Pending'} ${a.proposal || ''}`
  );

  const pending = applications.filter(a => !a.status || a.status === 'Pending').length;
  const approved = applications.filter(a => a.status === 'Approved').length;
  const rejected = applications.filter(a => a.status === 'Rejected').length;

  const statusBadge = (status) => {
    const map = { Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red' };
    return <span className={`admin-badge ${map[status] || 'badge-yellow'}`}>{status || 'Pending'}</span>;
  };

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 120 }} />
          <div className="admin-skeleton-cell" style={{ width: 160 }} />
          <div className="admin-skeleton-cell" style={{ width: 200 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 90 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <div className="admin-table-header">
        <div>
          <h1>Applications</h1>
          <p className="admin-table-count">{applications.length} proposals · Search by artisan, request, status, proposal</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Pending</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>{pending}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Approved</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{approved}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Rejected</p>
          <p className="admin-mini-stat-value" style={{ color: '#EF4444' }}>{rejected}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty"><p>No applications found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Artisan</th>
                <th>Request</th>
                <th>Proposal</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{a.artisanName}</span>
                      <span className="admin-cell-stack-secondary">ID #{a.artisanId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{a.requestName}</span>
                      <span className="admin-cell-stack-secondary">Request #{a.requestId}</span>
                    </div>
                  </td>
                  <td className="admin-cell-secondary admin-cell-truncate">
                    {a.proposal || '—'}
                  </td>
                  <td>{statusBadge(a.status)}</td>
                  <td className="admin-cell-secondary">
                    {a.applicationDate ? new Date(a.applicationDate).toLocaleDateString() : '—'}
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
