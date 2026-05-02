import { useState, useEffect } from 'react';
import { marketItemService } from '../../services/marketItemService';
import ProductCard from '../../components/cards/ProductCard';
import SearchBar from '../../components/ui/SearchBar';
import { ShimmerSimpleGallery } from 'react-shimmer-effects';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../utils/constants';
import { FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './MarketplacePage.css';

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const { isBuyer } = useAuth();
  const { addItem } = useCart();
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    const fetchItems = debouncedSearch
      ? marketItemService.search(debouncedSearch)
      : marketItemService.getAll();
    fetchItems
      .then(res => setItems(res.data?.items || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const filtered = items
    .filter(i => !category || i.category === category)
    .sort((a, b) => {
      if (sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (sort === 'price-desc') return Number(b.price) - Number(a.price);
      if (sort === 'newest') return b.id - a.id;
      return 0;
    });

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.item} added to cart!`);
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-hero">
        <div className="container">
          <h1>Marketplace</h1>
          <p>Discover unique handcrafted treasures from Egyptian artisans</p>
        </div>
      </div>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="marketplace-filters">
          <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
          <div className="marketplace-filter-group">
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select-field" value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">Sort By</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: '32px' }}>
            <ShimmerSimpleGallery card imageHeight={200} caption />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FiShoppingBag} title="No products found" message="Try adjusting your search or filters." />
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="marketplace-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={isBuyer ? handleAddToCart : null} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
