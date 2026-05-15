import { useState, useEffect } from 'react';
import { marketItemService } from '../../services/marketItemService';
import { useAdminData, filterByAllColumns } from './useAdminData';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import './AdminTable.css';

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { userName, loaded: lookupReady } = useAdminData();

  useEffect(() => {
    (async () => {
      try {
        const res = await marketItemService.getAll();
        setItems(res.data?.items || []);
      } catch { toast.error('Failed to load products'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}"? This action is irreversible.`)) return;
    try {
      await marketItemService.delete(id);
      toast.success('Product removed');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { toast.error('Failed to remove product'); }
  };

  const isReady = !loading && lookupReady;

  const enriched = items.map(i => ({
    ...i,
    // Backend already provides artisanName from JOIN; fall back to lookup only if null
    artisanName: i.artisanName || userName(i.artisan_id || i.artisanId),
    artisanId: i.artisan_id ?? i.artisanId,
  }));

  const filtered = filterByAllColumns(enriched, search, i =>
    `${i.id} ${i.item} ${i.category} ${i.price} ${i.artisanName} ${i.description || ''} ${i.availQuantity}`
  );

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const inStock = items.filter(i => (i.availQuantity ?? 0) > 0).length;

  const renderSkeleton = () => (
    <div className="admin-loading-skeleton">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          <div className="admin-skeleton-cell" style={{ width: 160 }} />
          <div className="admin-skeleton-cell" style={{ width: 80 }} />
          <div className="admin-skeleton-cell" style={{ width: 70 }} />
          <div className="admin-skeleton-cell" style={{ width: 50 }} />
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
          <h1>Market Items</h1>
          <p className="admin-table-count">{items.length} products · {categories.length} categories · Search by name, category, artisan, price</p>
        </div>
        <div className="admin-search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search all fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-mini-stats">
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Total Products</p>
          <p className="admin-mini-stat-value">{items.length}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">In Stock</p>
          <p className="admin-mini-stat-value" style={{ color: '#10B981' }}>{inStock}</p>
        </div>
        <div className="admin-mini-stat">
          <p className="admin-mini-stat-label">Categories</p>
          <p className="admin-mini-stat-value" style={{ color: '#8B5CF6' }}>{categories.length}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        {!isReady ? renderSkeleton() : filtered.length === 0 ? (
          <div className="admin-table-empty"><p>No products found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Artisan</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{i.item}</span>
                      <span className="admin-cell-stack-secondary">ID #{i.id}</span>
                    </div>
                  </td>
                  <td><span className="admin-badge badge-purple">{i.category || '—'}</span></td>
                  <td className="admin-cell-primary">{formatCurrency(i.price)}</td>
                  <td>
                    <span className={`admin-badge ${(i.availQuantity ?? 0) > 0 ? 'badge-green' : 'badge-red'}`}>
                      {i.availQuantity ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{i.artisanName}</span>
                      <span className="admin-cell-stack-secondary">ID #{i.artisanId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn danger" title="Remove" onClick={() => handleDelete(i.id, i.item)}>
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
