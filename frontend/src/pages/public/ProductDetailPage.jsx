import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { marketItemService } from '../../services/marketItemService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import TextArea from '../../components/ui/TextArea';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiShoppingCart, FiUser, FiMinus, FiPlus, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user, isBuyer } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketItemService.getById(id),
      reviewService.getByItem(id).catch(() => ({ data: { reviews: [] } }))
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data?.item);
      setReviews(rRes.data?.reviews || []);
    }).catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty);
    toast.success(`${product.item} added to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const res = await reviewService.create({ buyer_id: user.id, item_id: Number(id), rating: reviewForm.rating, comment: reviewForm.comment });
      setReviews(prev => [res.data.review, ...prev]);
      setReviewForm({ rating: 0, comment: '' });
      toast.success('Review submitted!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!product) return <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}><h2>Product not found</h2></div>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
            {product.image ? <img src={product.image} alt={product.item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=800&q=80'; }} /> : <FiPackage style={{ fontSize: 80, color: 'var(--sand-dark)' }} />}
          </div>
          <div>
            {product.category && <Badge status="Active">{product.category}</Badge>}
            <h1 style={{ fontSize: 36, marginTop: 12, marginBottom: 8 }}>{product.item}</h1>
            {product.artisanName && <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}><FiUser /> By {product.artisanName}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <StarRating rating={Math.round(Number(avgRating))} readonly size={22} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 32, color: 'var(--gold-dark)', fontWeight: 700, marginBottom: 20 }}>{formatCurrency(product.price)}</p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{product.description || 'No description available.'}</p>
            <p style={{ fontSize: 14, color: product.availQuantity > 0 ? 'var(--success)' : 'var(--error)', marginBottom: 24, fontWeight: 600 }}>
              {product.availQuantity > 0 ? `${product.availQuantity} in stock` : 'Out of stock'}
            </p>
            {isBuyer && product.availQuantity > 0 && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--surface-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '10px 14px', fontSize: 18 }}><FiMinus /></button>
                  <span style={{ padding: '10px 20px', fontWeight: 600, minWidth: 50, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty(Math.min(product.availQuantity, qty + 1))} style={{ padding: '10px 14px', fontSize: 18 }}><FiPlus /></button>
                </div>
                <Button icon={FiShoppingCart} onClick={handleAddToCart} size="lg">Add to Cart</Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)' }}>
          <h2 style={{ marginBottom: 24 }}>Reviews ({reviews.length})</h2>
          {isBuyer && (
            <form onSubmit={handleReviewSubmit} style={{ marginBottom: 32, padding: 24, background: 'var(--sand-light)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ marginBottom: 12 }}>Write a Review</h4>
              <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm(p => ({ ...p, rating: r }))} size={28} />
              <div style={{ marginTop: 12 }}><TextArea placeholder="Share your experience..." value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} rows={3} /></div>
              <Button type="submit" loading={submitting} style={{ marginTop: 12 }}>Submit Review</Button>
            </form>
          )}
          {reviews.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ paddingBottom: 20, borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{r.buyerName?.charAt(0) || 'U'}</div>
                    <div><p style={{ fontWeight: 600, fontSize: 15 }}>{r.buyerName || 'Anonymous'}</p><p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(r.reviewDate)}</p></div>
                    <div style={{ marginLeft: 'auto' }}><StarRating rating={r.rating} readonly size={16} /></div>
                  </div>
                  {r.comment && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
