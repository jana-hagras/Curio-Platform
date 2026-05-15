import { useState, useEffect, useMemo } from 'react';
import { applicationService } from '../../services/applicationService';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FiSearch, FiX, FiInbox, FiChevronDown, FiEye,
  FiUser, FiFileText, FiCalendar, FiTag, FiDollarSign,
  FiClock, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

/* ── Status Configs ──────────────────────────── */
const STATUS_CONF = {
  Pending:  { label: 'Pending',  cls: 'badge-yellow', icon: FiClock,       color: '#F59E0B' },
  Approved: { label: 'Approved', cls: 'badge-green',  icon: FiCheckCircle, color: '#10B981' },
  Rejected: { label: 'Rejected', cls: 'badge-red',    icon: FiXCircle,     color: '#EF4444' },
};

function StatusBadge({ status }) {
  const c = STATUS_CONF[status] || STATUS_CONF.Pending;
  return <span className={`admin-badge ${c.cls}`}>{c.label}</span>;
}

/* ── Filter Select ───────────────────────────── */
function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', padding: '7px 30px 7px 12px', borderRadius: 8,
          border: '1px solid var(--surface-border)', background: 'var(--surface-secondary)',
          color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
        }}
      >
        <option value="all">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FiChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
    </div>
  );
}

/* ── Detail Modal ────────────────────────────── */
function DetailModal({ app, onClose }) {
  if (!app) return null;
  const st = STATUS_CONF[app.status] || STATUS_CONF.Pending;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 560, width: '95%', maxHeight: '85vh', overflow: 'auto', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-body)', marginBottom: 6 }}>Application #{app.id}</h2>
            <StatusBadge status={app.status} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FiUser size={11} /> Artisan
              </div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{app.artisanName || `Artisan #${app.artisan_id}`}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID #{app.artisan_id}</p>
            </div>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FiUser size={11} /> Buyer
              </div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{app.buyerName || '—'}</p>
              {app.buyer_id && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID #{app.buyer_id}</p>}
            </div>
          </div>

          {/* Request Info */}
          <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FiFileText size={11} /> Request
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{app.requestTitle || `Request #${app.request_id}`}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
              {app.requestCategory && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiTag size={11} /> {app.requestCategory}</span>}
              {app.requestBudget && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiDollarSign size={11} /> {formatCurrency(app.requestBudget)}</span>}
            </div>
          </div>

          {/* Proposal */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FiFileText size={11} /> Proposal
            </div>
            <div style={{ background: 'var(--surface-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${st.color}` }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {app.proposal || 'No proposal text provided.'}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiCalendar size={13} />
              {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Request #{app.request_id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────── */
function Skeleton() {
  return (
    <div className="admin-loading-skeleton">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          {[40, 130, 130, 120, 200, 70, 90].map((w, j) => (
            <div key={j} className="admin-skeleton-cell" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────── */
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  /* ── Fetch All ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await applicationService.getAll();
        setApplications(res.data?.applications || []);
      } catch (e) {
        console.error('Failed to load applications:', e);
        toast.error('Failed to load applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Filter + Search ───────────────────────── */
  const filtered = useMemo(() => {
    return applications.filter(a => {
      // Status filter
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;

      // Search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [
        a.id, a.artisanName, a.buyerName, a.requestTitle,
        a.requestCategory, a.proposal, a.status, a.applicationDate,
      ].some(v => String(v ?? '').toLowerCase().includes(q));
    });
  }, [applications, search, filterStatus]);

  /* ── Stats ─────────────────────────────────── */
  const total    = applications.length;
  const pending  = applications.filter(a => !a.status || a.status === 'Pending').length;
  const approved = applications.filter(a => a.status === 'Approved').length;
  const rejected = applications.filter(a => a.status === 'Rejected').length;

  const hasFilters = search || filterStatus !== 'all';

  return (
    <div className="admin-table-page">
      {/* ── Header ── */}
      <div className="admin-table-header">
        <div>
          <h1>Applications</h1>
          <p className="admin-table-count">
            {loading
              ? 'Loading applications…'
              : `${filtered.length} of ${total} applications`
            }
          </p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" size={14} />
          <input
            placeholder="Search artisan, buyer, request, proposal…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="admin-mini-stats">
        <div className="admin-mini-stat" onClick={() => setFilterStatus('all')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'all' ? '2px solid var(--gold-primary)' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Total</p>
          <p className="admin-mini-stat-value" style={{ color: 'var(--gold-primary)' }}>{total}</p>
        </div>
        <div className="admin-mini-stat" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'Pending' ? '2px solid #F59E0B' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Pending</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>{pending}</p>
        </div>
        <div className="admin-mini-stat" onClick={() => setFilterStatus('Approved')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'Approved' ? '2px solid #10B981' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Approved</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{approved}</p>
        </div>
        <div className="admin-mini-stat" onClick={() => setFilterStatus('Rejected')} style={{ cursor: 'pointer', borderBottom: filterStatus === 'Rejected' ? '2px solid #EF4444' : '2px solid transparent' }}>
          <p className="admin-mini-stat-label">Rejected</p>
          <p className="admin-mini-stat-value" style={{ color: '#EF4444' }}>{rejected}</p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>Filter:</span>
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="All Statuses"
          options={[
            { value: 'Pending',  label: '⏳ Pending'  },
            { value: 'Approved', label: '✅ Approved' },
            { value: 'Rejected', label: '❌ Rejected' },
          ]}
        />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
          >
            <FiX size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="admin-table-wrapper">
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <FiInbox size={44} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {hasFilters ? 'No matching applications' : 'No applications yet'}
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              {hasFilters ? 'Try adjusting your search or filters.' : 'Applications will appear here when artisans submit proposals.'}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterStatus('all'); }}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 16px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
              >
                <FiX size={12} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Artisan</th>
                <th>Buyer</th>
                <th>Request</th>
                <th>Proposal</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} onClick={() => setSelected(a)} style={{ cursor: 'pointer' }}>
                  <td className="admin-cell-id">#{a.id}</td>

                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{a.artisanName || '—'}</span>
                      <span className="admin-cell-stack-secondary">ID #{a.artisan_id}</span>
                    </div>
                  </td>

                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{a.buyerName || '—'}</span>
                      {a.buyer_id && <span className="admin-cell-stack-secondary">ID #{a.buyer_id}</span>}
                    </div>
                  </td>

                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{a.requestTitle || '—'}</span>
                      <span className="admin-cell-stack-secondary">
                        {a.requestCategory && <>{a.requestCategory} · </>}
                        {a.requestBudget ? formatCurrency(a.requestBudget) : `#${a.request_id}`}
                      </span>
                    </div>
                  </td>

                  <td>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', maxWidth: 240,
                    }}>
                      {a.proposal || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No proposal</span>}
                    </p>
                  </td>

                  <td><StatusBadge status={a.status} /></td>

                  <td className="admin-cell-secondary">
                    {a.applicationDate
                      ? new Date(a.applicationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>

                  <td>
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(a); }}
                      title="View details"
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: 'var(--surface-secondary)', border: 'none',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--black-deep)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <FiEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
