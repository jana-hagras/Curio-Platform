import { useState, useEffect, useMemo } from 'react';
import { reviewService } from '../../services/reviewService';
import {
  FiSearch, FiX, FiStar, FiEye, FiTrash2, FiInbox,
  FiChevronDown, FiUser, FiPackage, FiCalendar, FiMessageSquare,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

/* ── Helpers ─────────────────────────────────── */
const Stars = ({ rating, size = 13 }) => (
  <span style={{ display: 'flex', gap: 2, color: '#F59E0B', alignItems: 'center' }}>
    {[...Array(5)].map((_, i) => (
      <FiStar key={i} style={{ fill: i < rating ? '#F59E0B' : 'transparent', fontSize: size }} />
    ))}
    <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-secondary)' }}>{rating}/5</span>
  </span>
);

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', padding: '7px 30px 7px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
        <option value="all">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FiChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
    </div>
  );
}

/* ── Detail Modal ────────────────────────────── */
function DetailModal({ review: r, onClose, onDelete }) {
  if (!r) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 560, width: '95%', maxHeight: '85vh', overflow: 'auto', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Review #{r.id}</h2>
            <Stars rating={r.rating} size={16} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FiUser size={11} /> Reviewer</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{r.buyerName || '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Buyer #{r.buyer_id}</p>
            </div>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FiPackage size={11} /> Product</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{r.itemName || '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.itemCategory || `Item #${r.item_id}`}</p>
            </div>
          </div>
          {r.artisanName && (
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Product Owner (Artisan)</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{r.artisanName}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Artisan #{r.artisan_id}</p>
            </div>
          )}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><FiMessageSquare size={11} /> Review Comment</div>
            <div style={{ background: 'var(--surface-secondary)', padding: 16, borderRadius: 'var(--radius-md)', borderLeft: '3px solid #F59E0B' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.comment || 'No comment provided.'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
              <FiCalendar size={13} />
              {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
            <button onClick={() => onDelete(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              <FiTrash2 size={13} /> Delete Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ────────────────────── */
function ConfirmDeleteModal({ reviewId, onConfirm, onCancel }) {
  if (!reviewId) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, width: '90%', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Delete Review #{reviewId}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to permanently delete this review? This moderation action cannot be undone and will be logged.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onConfirm(reviewId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Delete Review</button>
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
          {[40, 120, 120, 80, 70, 200, 80, 50].map((w, j) => (
            <div key={j} className="admin-skeleton-cell" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────── */
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await reviewService.getAll();
        setReviews(res.data?.reviews || []);
      } catch (e) {
        console.error('Failed to load reviews:', e);
        toast.error('Failed to load reviews');
      } finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id) => {
    try {
      await reviewService.delete(id);
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r.id !== id));
      setConfirmDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch { toast.error('Failed to delete review'); }
  };

  const requestDelete = (id) => {
    setSelected(null);
    setConfirmDeleteId(id);
  };

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (filterRating !== 'all' && Number(r.rating) !== Number(filterRating)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [r.id, r.buyerName, r.itemName, r.artisanName, r.itemCategory, r.comment, r.rating, r.reviewDate]
        .some(v => String(v ?? '').toLowerCase().includes(q));
    });
  }, [reviews, search, filterRating]);

  const total = reviews.length;
  const avgRating = total ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1) : '0.0';
  const fiveStar = reviews.filter(r => Number(r.rating) === 5).length;
  const lowRating = reviews.filter(r => Number(r.rating) <= 2).length;
  const recent7d = reviews.filter(r => { const d = new Date(r.reviewDate); return (Date.now() - d.getTime()) < 7 * 86400000; }).length;

  const hasFilters = search || filterRating !== 'all';

  return (
    <div className="admin-table-page">
      {/* Header */}
      <div className="admin-table-header">
        <div>
          <h1>Reviews</h1>
          <p className="admin-table-count">{loading ? 'Loading…' : `${filtered.length} of ${total} reviews`}</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" size={14} />
          <input placeholder="Search reviewer, product, artisan, comment…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><FiX size={13} /></button>}
        </div>
      </div>

      {/* Stats */}
      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Reviews</p>
          <p className="admin-mini-stat-value" style={{ color: 'var(--gold-primary)' }}>{total}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Average Rating</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>⭐ {avgRating}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">5-Star Reviews</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{fiveStar}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Low Ratings (≤2)</p>
          <p className="admin-mini-stat-value" style={{ color: '#EF4444' }}>{lowRating}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Last 7 Days</p>
          <p className="admin-mini-stat-value" style={{ color: '#8B5CF6' }}>{recent7d}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>Filter:</span>
        <FilterSelect value={filterRating} onChange={setFilterRating} placeholder="All Ratings"
          options={[5,4,3,2,1].map(n => ({ value: String(n), label: `${'⭐'.repeat(n)} ${n} Star${n>1?'s':''}` }))} />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterRating('all'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
            <FiX size={11} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="admin-table-empty" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <FiInbox size={44} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{hasFilters ? 'No matching reviews' : 'No reviews yet'}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{hasFilters ? 'Try adjusting your search or filters.' : 'Reviews will appear here when buyers review products.'}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reviewer</th>
                <th>Product</th>
                <th>Artisan</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer' }}>
                  <td className="admin-cell-id">#{r.id}</td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.buyerName || '—'}</span>
                      <span className="admin-cell-stack-secondary">Buyer #{r.buyer_id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.itemName || '—'}</span>
                      <span className="admin-cell-stack-secondary">{r.itemCategory || `Item #${r.item_id}`}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.artisanName || '—'}</span>
                      {r.artisan_id && <span className="admin-cell-stack-secondary">#{r.artisan_id}</span>}
                    </div>
                  </td>
                  <td><Stars rating={r.rating} /></td>
                  <td>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 220 }}>
                      {r.comment || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No comment</span>}
                    </p>
                  </td>
                  <td className="admin-cell-secondary">
                    {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="View" onClick={e => { e.stopPropagation(); setSelected(r); }}
                        className="admin-action-btn"><FiEye size={13} /></button>
                      <button title="Delete" onClick={e => { e.stopPropagation(); requestDelete(r.id); }}
                        className="admin-action-btn danger"><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <DetailModal review={selected} onClose={() => setSelected(null)} onDelete={requestDelete} />}
      <ConfirmDeleteModal reviewId={confirmDeleteId} onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
