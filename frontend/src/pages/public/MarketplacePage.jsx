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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['marketplace', 'common']);

  useEffect(() => {
    setLoading(true);
    const fetchItems = debouncedSearch
      ? marketItemService.search(debouncedSearch)
      : marketItemService.getAll();
    fetchItems
      .then(res => setItems(res.data?.items || []))
      .catch(() => toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to load products' : 'فشل تحميل المنتجات'))
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
    toast.success(`${product.item || product.itemName} ${t('common:nav.adminPanel') === 'Admin Panel' ? 'added to cart!' : 'تمت إضافته إلى سلة التسوق!'}`);
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-hero">
        <div className="container">
          <span className="marketplace-hero-badge">{t('common:nav.marketplace') || 'Catalog'}</span>
          <h1>{t('marketplace:title')}</h1>
          <p>{t('marketplace:subtitle')}</p>
        </div>
      </div>
      <div className="container marketplace-content">
        <div className="marketplace-filters">
          <div className="marketplace-search-wrapper">
            <SearchBar value={search} onChange={setSearch} placeholder={t('marketplace:search')} />
          </div>
          <div className="marketplace-filter-group">
            <select className="select-field" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">{t('marketplace:allCategories')}</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{t('common:categories.' + c, c)}</option>)}
            </select>
            <select className="select-field" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">{t('marketplace:sortBy')}</option>
              <option value="newest">{t('marketplace:sortOptions.newest')}</option>
              <option value="price-asc">{t('marketplace:sortOptions.priceLow')}</option>
              <option value="price-desc">{t('marketplace:sortOptions.priceHigh')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="marketplace-shimmer-wrapper">
            <ShimmerSimpleGallery card imageHeight={200} caption />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FiShoppingBag} title={t('marketplace:noProducts')} message={t('marketplace:noProductsDesc')} />
        ) : (
          <>
            <p className="marketplace-count-text">{t('marketplace:showing', { count: filtered.length })}</p>
            <div className="marketplace-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={isBuyer ? handleAddToCart : null} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

