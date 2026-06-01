import { useState, useEffect } from 'react';
import { marketItemService } from '../../services/marketItemService';
import SearchBar from '../../components/ui/SearchBar';
import { ShimmerSimpleGallery } from 'react-shimmer-effects';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../utils/constants';
import { useTranslation } from 'react-i18next';
import { FiShoppingBag, FiHeart, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from '../../components/ui/Image';
import { formatCurrency } from '../../utils/formatCurrency';
import { useFavorites } from '../../hooks/useFavorites';
import './MarketplacePage.css';

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('ALL');
  const { isBuyer, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const debouncedSearch = useDebounce(search);
  const { t } = useTranslation(['marketplace', 'common']);

  // Favorites hook integration
  let favorites = {
    isFavorite: () => false,
    addFavorite: () => { },
    removeFavorite: () => { },
  };
  try {
    favorites = useFavorites();
  } catch {}
  const { isFavorite, addFavorite, removeFavorite } = favorites;

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

  // Dynamic Egypt regions mapping for luxury catalog realism
  const getRegionForProduct = (item) => {
    if (item.origin) return item.origin.toUpperCase();
    const idMod = item.id % 5;
    if (idMod === 0) return 'CAIRO';
    if (idMod === 1) return 'ALEXANDRIA';
    if (idMod === 2) return 'LUXOR';
    if (idMod === 3) return 'ASWAN';
    return 'FAYOUM';
  };

  const filtered = items
    .filter(i => !category || i.category === category);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.item || product.itemName} ${t('common:nav.addedToCart') || 'added to cart!'}`);
  };

  const toggleFav = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const fav = isFavorite(product.id);
    if (fav) {
      removeFavorite(product.id);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? "Removed from favorites" : "تمت الإزالة من المفضلة");
    } else {
      addFavorite(product);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? "Added to favorites" : "تمت الإضافة إلى المفضلة");
    }
  };

  return (
    <div className="peaceput-shop">
      <div className="peaceput-layout-container">
        {/* Sticky Left Sidebar Categories */}
        <aside className="peaceput-sidebar">
          <div className="sidebar-search-block">
            <SearchBar value={search} onChange={setSearch} placeholder={t('marketplace:search')} />
          </div>
          <div className="sidebar-divider"></div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-nav-link ${category === '' ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              {t('marketplace:allCreations').toUpperCase()}
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`sidebar-nav-link ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {t('common:categories.' + c, c).toUpperCase()}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Shops Catalog List */}
        <main className="peaceput-catalog">
          {loading ? (
            <div className="marketplace-shimmer-wrapper">
              <ShimmerSimpleGallery card imageHeight={300} caption />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={FiShoppingBag} title={t('marketplace:noProducts')} message={t('marketplace:noProductsDesc')} />
          ) : (
            <div className="peaceput-items-list">
              {filtered.map(product => {
                const fav = isFavorite(product.id);
                return (
                  <div key={product.id} className="peaceput-item" id={`product-item-${product.id}`}>
                    {/* Left: Landscape Image */}
                    <div className="peaceput-item-media">
                      <Image 
                        src={product.image}
                        alt={product.item || product.itemName}
                        fallback="https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=800&q=80"
                      />
                      {isAuthenticated && (
                        <button
                          className={`peaceput-item-fav-btn ${fav ? "active" : ""}`}
                          onClick={(e) => toggleFav(e, product)}
                        >
                          <FiHeart />
                        </button>
                      )}
                    </div>

                    {/* Right: Technical Spec Rows & Summary */}
                    <div className="peaceput-item-details">
                      <h2 className="peaceput-item-title">{product.item || product.itemName}</h2>
                      
                      <div className="peaceput-spec-table">
                        <div className="peaceput-spec-row">
                          <span className="spec-label">{t('marketplace:spec.artisan')}</span>
                          <span className="spec-value">{product.artisanName || t('marketplace:masterArtisan')}</span>
                        </div>
                        <div className="peaceput-spec-row">
                          <span className="spec-label">{t('marketplace:spec.category')}</span>
                          <span className="spec-value">{t('common:categories.' + product.category, product.category).toUpperCase()}</span>
                        </div>
                        <div className="peaceput-spec-row">
                          <span className="spec-label">{t('marketplace:spec.price')}</span>
                          <span className="spec-value spec-price">{formatCurrency(product.price)}</span>
                        </div>
                      </div>

                      <p className="peaceput-item-description">{product.description}</p>
                      
                      <div className="peaceput-item-actions">
                        {isBuyer && product.availQuantity > 0 && (
                          <button 
                            className="peaceput-add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            <FiShoppingCart size={13} /> {t('marketplace:addToCart').toUpperCase()}
                          </button>
                        )}
                        {product.availQuantity === 0 && (
                          <span className="peaceput-sold-label">{t('common:nav.adminPanel') === 'Admin Panel' ? 'SOLD OUT' : 'نفذت الكمية'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

