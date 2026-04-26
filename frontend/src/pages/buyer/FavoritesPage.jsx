import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import ProductCard from '../../components/cards/ProductCard';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const { isBuyer } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Favorites</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{favorites.length} saved items</p>
      </div>
      {favorites.length === 0 ? (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '80px 32px', textAlign: 'center' }}>
          <FiHeart style={{ fontSize: 56, color: 'var(--surface-border)', marginBottom: 20 }} />
          <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>No favorites yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>Browse the marketplace and save items you love</p>
          <Button onClick={() => navigate('/marketplace')}>Explore Marketplace</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {favorites.map(product => (
            <div key={product.id} style={{ position: 'relative' }}>
              <ProductCard product={product} onAddToCart={isBuyer ? (p) => { addItem(p); toast.success('Added to cart!'); } : null} />
              <button onClick={() => { removeFavorite(product.id); toast.success('Removed from favorites'); }}
                style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', background: 'var(--error)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, zIndex: 2, boxShadow: 'var(--shadow-md)' }}
                title="Remove from favorites">
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
