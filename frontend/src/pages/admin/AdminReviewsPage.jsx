import { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, itemName, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await reviewService.search('');
        setReviews(res.data?.reviews || []);
      } catch { setReviews([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(`Delete review #${id}? This moderation action is logged.`)) return;
    try {
      await reviewService.delete(id);
      toast.success('Review removed');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('Failed to delete review'); }
  };

  const isReady = !loading && lookupReady;

  const enriched = reviews.map(r => ({
    ...r,
    // Backend already provides buyerName/itemName from JOIN; fall back to lookup only if null
    buyerName: r.buyerName || userName(r.buyer_id || r.buyerId),
    productName: r.itemName || itemName(r.item_id || r.itemId),
    buyerId: r.buyer_id ?? r.buyerId,
    itemId: r.item_id ?? r.itemId,
  }));

  const filtered = filterByAllColumns(enriched, search, r =>
    `${r.id} ${r.buyerName} ${r.productName} ${r.rating} ${r.comment || ''}`
  );

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingStars = (rating) => (
    <span style={{ display: 'flex', gap: 2, color: '#F59E0B', alignItems: 'center' }}>
      {[...Array(5)].map((_, i) => (
        <FiStar key={i} style={{ fill: i < rating ? '#F59E0B' : 'transparent', fontSize: 13 }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-secondary)' }}>{rating}/5</span>
    </span>
  );

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 120 }} />
          <div className="admin-skeleton-cell" style={{ width: 140 }} />
          <div className="admin-skeleton-cell" style={{ width: 90 }} />
          <div className="admin-skeleton-cell" style={{ width: 200 }} />
          <div className="admin-skeleton-cell" style={{ width: 40 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="admin-table-page">
      <div className="admin-table-header">
        <div>
          <h1>Reviews</h1>
          <p className="admin-table-count">{reviews.length} reviews · Search by reviewer, product, rating, comment</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Reviews</p>
          <p className="admin-mini-stat-value">{reviews.length}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Average Rating</p>
          <p className="admin-mini-stat-value" style={{ color: '#F59E0B' }}>⭐ {avgRating}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty"><p>No reviews found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.buyerName}</span>
                      <span className="admin-cell-stack-secondary">Buyer #{r.buyerId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{r.productName}</span>
                      <span className="admin-cell-stack-secondary">Item #{r.itemId}</span>
                    </div>
                  </td>
                  <td>{ratingStars(r.rating)}</td>
                  <td className="admin-cell-secondary admin-cell-truncate">
                    {r.comment || '—'}
                  </td>
                  <td className="admin-cell-secondary">
                    {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn danger" title="Remove (moderate)" onClick={() => handleDelete(r.id)}>
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
