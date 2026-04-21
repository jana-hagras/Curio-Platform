import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { marketItemService } from '../../services/marketItemService';
import { portfolioService } from '../../services/portfolioService';
import ProductCard from '../../components/cards/ProductCard';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FiCheckCircle, FiMapPin, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const { isBuyer } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      userService.getById(id),
      marketItemService.getByArtisan(id).catch(() => ({ data: { items: [] } })),
      portfolioService.getAll().catch(() => ({ data: { projects: [] } }))
    ]).then(([uRes, iRes, pRes]) => {
      setArtisan(uRes.data?.user);
      setProducts(iRes.data?.items || []);
      setProjects((pRes.data?.projects || []).filter(p => p.artisan_id === Number(id)));
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!artisan) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>Artisan not found</h2></div>;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 40, marginBottom: 32, border: '1px solid var(--sand-warm)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {artisan.profileImage ? <img src={artisan.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : `${artisan.firstName?.charAt(0)}${artisan.lastName?.charAt(0)}`}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 28 }}>{artisan.firstName} {artisan.lastName}</h1>
              {artisan.verified && <FiCheckCircle style={{ color: 'var(--success)', fontSize: 22 }} />}
              <Badge status={artisan.status || 'Active'} />
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12, maxWidth: 600 }}>{artisan.bio || 'Egyptian Artisan'}</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
              {artisan.address && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin /> {artisan.address}</span>}
              {artisan.email && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMail /> {artisan.email}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['products', 'portfolio'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 15, background: tab === t ? 'var(--gold-primary)' : 'var(--white)', color: tab === t ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--sand-warm)', transition: 'all 200ms' }}>
              {t === 'products' ? `Products (${products.length})` : `Portfolio (${projects.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          products.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={isBuyer ? (pr) => { addItem(pr); toast.success('Added!'); } : null} />)}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No products yet.</p>
        )}
        {tab === 'portfolio' && (
          projects.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--sand-warm)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>{p.projectName}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{p.description || 'No description.'}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No portfolio projects yet.</p>
        )}
      </div>
    </div>
  );
}
