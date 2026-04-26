import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { marketItemService } from '../../services/marketItemService';
import { portfolioService } from '../../services/portfolioService';
import { reviewService } from '../../services/reviewService';
import ProductCard from '../../components/cards/ProductCard';
import StarRating from '../../components/ui/StarRating';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FiCheckCircle, FiMapPin, FiMail, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const { user, isBuyer } = useAuth();
  const { addItem } = useCart();

  // Review form
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      userService.getById(id),
      marketItemService.getByArtisan(id).catch(() => ({ data: { items: [] } })),
      portfolioService.getAll().catch(() => ({ data: { projects: [] } })),
    ]).then(([uRes, iRes, pRes]) => {
      setArtisan(uRes.data?.user);
      const prods = iRes.data?.items || [];
      setProducts(prods);
      setProjects((pRes.data?.projects || []).filter(p => p.artisan_id === Number(id)));

      // Load reviews for all products
      if (prods.length > 0) {
        Promise.all(prods.map(p =>
          reviewService.getByItem(p.id).catch(() => ({ data: { reviews: [] } }))
        )).then(results => {
          const allRevs = results.flatMap(r => r.data?.reviews || []);
          setReviews(allRevs);
        });
      }
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');
    if (!products.length) return toast.error('No products to review');
    setSubmitting(true);
    try {
      const res = await reviewService.create({
        item_id: products[0].id,
        buyer_id: user.id,
        rating,
        comment: feedback,
        reviewDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      setReviews(prev => [...prev, res.data?.review || { rating, comment: feedback, buyerName: user.firstName }]);
      setRating(0);
      setFeedback('');
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!artisan) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>Artisan not found</h2></div>;

  const imgSrc = artisan.profileImage
    ? (artisan.profileImage.startsWith('/') ? `http://localhost:3000${artisan.profileImage}` : artisan.profileImage)
    : null;

  const tabs = ['products', 'portfolio', 'reviews'];

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Profile Header */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 40, marginBottom: 32, border: '1px solid var(--surface-border)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: 'var(--black-deep)', overflow: 'hidden' }}>
              {imgSrc ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${artisan.firstName?.charAt(0)}${artisan.lastName?.charAt(0)}`}
            </div>
            {artisan.status === 'Active' && <div style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, backgroundColor: 'var(--success)', border: '4px solid var(--surface-primary)', borderRadius: '50%', zIndex: 2 }} title="Active"></div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 28 }}>{artisan.firstName} {artisan.lastName}</h1>
              {artisan.verified && <FiCheckCircle style={{ color: 'var(--success)', fontSize: 22 }} />}
              <Badge status={artisan.status || 'Active'} />
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12, maxWidth: 600 }}>{artisan.bio || 'Egyptian Artisan'}</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 14, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              {artisan.address && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin /> {artisan.address}</span>}
              {artisan.email && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMail /> {artisan.email}</span>}
              {reviews.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiStar style={{ color: '#F59E0B' }} /> {avgRating} ({reviews.length} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-full)',
              fontWeight: 600, fontSize: 14,
              background: tab === t ? 'var(--gold-primary)' : 'var(--surface-primary)',
              color: tab === t ? 'var(--black-deep)' : 'var(--text-secondary)',
              border: '1px solid var(--surface-border)', transition: 'all 200ms',
              textTransform: 'capitalize',
            }}>
              {t === 'products' ? `Products (${products.length})` : t === 'portfolio' ? `Portfolio (${projects.length})` : `Reviews (${reviews.length})`}
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
                <div key={p.id} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--surface-border)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>{p.projectName}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{p.description || 'No description.'}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No portfolio projects yet.</p>
        )}

        {tab === 'reviews' && (
          <div>
            {/* Submit Review */}
            {isBuyer && (
              <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16 }}>Write a Review</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>Rating</label>
                    <StarRating rating={rating} onRate={setRating} size={28} />
                  </div>
                  <TextArea placeholder="Share your experience..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
                  <Button type="submit" loading={submitting} style={{ marginTop: 12 }}>Submit Review</Button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No reviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map((r, i) => (
                  <div key={r.id || i} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating rating={r.rating} readonly size={16} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.buyerName || 'Buyer'}</span>
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
