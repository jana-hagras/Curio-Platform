import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketItemService } from '../../services/marketItemService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import TextArea from '../../components/ui/TextArea';
import Image from '../../components/ui/Image';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiUser, FiMinus, FiPlus, FiPackage, FiArrowLeft, FiEdit3, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ProductDetailPage.css';

/* ── Edit Review Modal ───────────────────────── */
function EditReviewModal({ review, onClose, onSave }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation(['common']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Please select a rating' : 'الرجاء اختيار التقييم');
    setSaving(true);
    try {
      await onSave(review.id, { rating, comment });
      onClose();
    } catch { /* handled in parent */ }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 520, width: '95%', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Edit Your Review' : 'تعديل التقييم'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 10, color: 'var(--text-primary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Rating' : 'التقييم'}</label>
            <StarRating rating={rating} onRate={setRating} size={32} />
          </div>
          <TextArea label={t('common:nav.adminPanel') === 'Admin Panel' ? 'Comment' : 'التعليق'} value={comment} onChange={e => setComment(e.target.value)} placeholder={t('common:nav.adminPanel') === 'Admin Panel' ? "Update your experience..." : "حدّث تجربتك هنا..."} rows={4} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
            <Button variant="ghost" type="button" onClick={onClose}>{t('common:actions.cancel') || 'Cancel'}</Button>
            <Button type="submit" loading={saving}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Save Changes' : 'حفظ التعديلات'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const { user, isBuyer } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketItemService.getById(id),
      reviewService.getByItem(id).catch(() => ({ data: { reviews: [] } }))
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data?.item);
      setReviews(rRes.data?.reviews || []);
    }).catch(() => toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to load product' : 'فشل تحميل المنتج'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty);
    toast.success(`${product.item} ${t('common:nav.adminPanel') === 'Admin Panel' ? 'added to cart!' : 'تمت إضافته إلى سلة التسوق!'}`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Please select a rating' : 'الرجاء اختيار التقييم'); return; }
    setSubmitting(true);
    try {
      const res = await reviewService.create({ buyer_id: user.id, item_id: Number(id), rating: reviewForm.rating, comment: reviewForm.comment });
      setReviews(prev => [res.data.review, ...prev]);
      setReviewForm({ rating: 0, comment: '' });
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Review submitted!' : 'تم تقديم التقييم بنجاح!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEditReview = async (reviewId, data) => {
    try {
      const res = await reviewService.update(reviewId, { ...data, buyer_id: user.id });
      const updated = res.data?.review;
      if (updated) {
        setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
      }
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Review updated!' : 'تم تحديث التقييم بنجاح!');
    } catch (err) {
      const msg = err?.response?.data?.message || (t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to update review' : 'فشل تحديث التقييم');
      toast.error(msg);
      throw err;
    }
  };

  // Check if current user already has a review on this product
  const userReview = isBuyer && user ? reviews.find(r => r.buyer_id === user.id) : null;

  if (loading) return <Spinner />;
  if (!product) return <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}><h2>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Product not found' : 'المنتج غير موجود'}</h2></div>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="product-detail-page">
      <div className="container">
        <button 
          onClick={() => navigate(-1)} 
          className="product-detail-back-btn"
        >
          <FiArrowLeft size={20} className="rtl-flip" /> 
        </button>
        <div className="product-detail-grid">
          <div className="product-detail-images">
            <div className="product-detail-main-img">
              {product.images?.length > 0 || product.image ? (
                <Image 
                  src={selectedImage || product.images?.[0]?.url || product.image} 
                  alt={product.item} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                /> 
              ) : (
                <FiPackage style={{ fontSize: 80, color: 'var(--sand-dark)' }} />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="product-detail-thumbs">
                {product.images.map((img) => (
                  <div 
                    key={img.id} 
                    onClick={() => setSelectedImage(img.url)}
                    className={`product-detail-thumb-item ${selectedImage === img.url ? 'active' : ''}`}
                  >
                    <Image src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="product-detail-info">
            {product.category && <Badge status="Active">{t('common:categories.' + product.category, product.category)}</Badge>}
            <h1 className="product-detail-title">{product.item}</h1>
            {product.artisanName && <p className="product-detail-artisan"><FiUser /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'By' : 'بواسطة'} {product.artisanName}</p>}
            <div className="product-detail-rating-row">
              <StarRating rating={Math.round(Number(avgRating))} readonly size={22} />
              <span className="product-detail-rating-text">({reviews.length} {t('common:nav.adminPanel') === 'Admin Panel' ? `review${reviews.length !== 1 ? 's' : ''}` : 'تقييم'})</span>
            </div>
            <p className="product-detail-price">{formatCurrency(product.price)}</p>
            <p className="product-detail-desc">{product.description || (t('common:nav.adminPanel') === 'Admin Panel' ? 'No description available.' : 'لا يوجد وصف متاح.')}</p>
            <p style={{ fontSize: 14, color: product.availQuantity > 0 ? 'var(--success)' : 'var(--error)', marginBottom: 24, fontWeight: 600 }}>
              {product.availQuantity > 0 ? (t('common:nav.adminPanel') === 'Admin Panel' ? `${product.availQuantity} in stock` : `متوفر في المخزن: ${product.availQuantity}`) : (t('common:nav.adminPanel') === 'Admin Panel' ? 'Out of stock' : 'نفذت الكمية')}
            </p>
            {isBuyer && product.availQuantity > 0 && (
              <div className="product-detail-qty-row">
                <div className="product-detail-qty-picker">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}><FiMinus /></button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(Math.min(product.availQuantity, qty + 1))}><FiPlus /></button>
                </div>
                <Button icon={FiShoppingCart} onClick={handleAddToCart} size="lg">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Add to Cart' : 'أضف إلى السلة'}</Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="product-detail-reviews-section">
          <h2 className="product-detail-reviews-title">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Reviews' : 'التقييمات'} ({reviews.length})</h2>
          {/* Show write form only if buyer hasn't reviewed yet */}
          {isBuyer && !userReview && (
            <form onSubmit={handleReviewSubmit} className="product-detail-review-form">
              <h4>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Write a Review' : 'اكتب تقييماً'}</h4>
              <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm(p => ({ ...p, rating: r }))} size={28} />
              <div style={{ marginTop: 12 }}><TextArea placeholder={t('common:nav.adminPanel') === 'Admin Panel' ? "Share your experience..." : "شاركنا تجربتك..."} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} rows={3} /></div>
              <Button type="submit" loading={submitting} style={{ marginTop: 12 }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Submit Review' : 'إرسال التقييم'}</Button>
            </form>
          )}
          {reviews.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'No reviews yet.' : 'لا توجد تقييمات بعد.'}</p> : (
            <div className="product-detail-review-list">
              {reviews.map(r => {
                const isOwner = isBuyer && user && r.buyer_id === user.id;
                return (
                  <div key={r.id} className="product-detail-review-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{r.buyerName?.charAt(0) || 'U'}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontWeight: 600, fontSize: 15 }}>{r.buyerName || (t('common:nav.adminPanel') === 'Admin Panel' ? 'Anonymous' : 'مجهول')}</p>
                          {r.editedAt && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', background: 'var(--surface-secondary)', padding: '2px 6px', borderRadius: 4 }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Edited' : 'معدل'}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(r.reviewDate)}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating rating={r.rating} readonly size={16} />
                        {isOwner && (
                          <button
                            onClick={() => setEditingReview(r)}
                            title={t('common:nav.adminPanel') === 'Admin Panel' ? "Edit your review" : "تعديل تقييمك"}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              borderRadius: 6, border: '1px solid var(--surface-border)',
                              background: 'transparent', color: 'var(--text-secondary)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 500,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <FiEdit3 size={11} /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'Edit' : 'تعديل'}
                          </button>
                        )}
                      </div>
                    </div>
                    {r.comment && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSave={handleEditReview}
        />
      )}
    </div>
  );
}

