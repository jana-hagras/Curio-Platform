import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { marketItemService } from '../../services/marketItemService';
import { portfolioService } from '../../services/portfolioService';
import { galleryService } from '../../services/galleryService';
import { reviewService } from '../../services/reviewService';
import ProductCard from '../../components/cards/ProductCard';
import StarRating from '../../components/ui/StarRating';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FiCheckCircle, FiMapPin, FiMail, FiStar, FiImage, FiChevronLeft, FiChevronRight, FiEdit3, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectImages, setProjectImages] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [tab, setTab] = useState('products');
  const { user, isBuyer } = useAuth();
  const { addItem } = useCart();

  // Review form
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      userService.getById(id),
      marketItemService.getByArtisan(id).catch(() => ({ data: { items: [] } })),
      portfolioService.getAll().catch(() => ({ data: { projects: [] } })),
    ]).then(async ([uRes, iRes, pRes]) => {
      setArtisan(uRes.data?.user);
      const prods = iRes.data?.items || [];
      setProducts(prods);
      const filteredProjs = (pRes.data?.projects || []).filter(p => p.artisan_id === Number(id));
      setProjects(filteredProjs);

      // Load gallery images for each portfolio project
      const imgMap = {};
      await Promise.all(filteredProjs.map(async (p) => {
        try {
          const gRes = await galleryService.getByProject(p.id);
          imgMap[p.id] = gRes.data?.gallery || [];
        } catch { imgMap[p.id] = []; }
      }));
      setProjectImages(imgMap);

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

  const handleEditReview = async (reviewId, data) => {
    try {
      const res = await reviewService.update(reviewId, { ...data, buyer_id: user.id });
      const updated = res.data?.review;
      if (updated) setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
      toast.success('Review updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update review');
      throw err;
    }
  };

  const userAlreadyReviewed = isBuyer && user ? reviews.some(r => r.buyer_id === user.id) : false;

  if (loading) return <Spinner />;
  if (!artisan) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>Artisan not found</h2></div>;

  const imgSrc = artisan.profileImage
    ? (artisan.profileImage.startsWith('/') ? `http://localhost:3000${artisan.profileImage}` : artisan.profileImage)
    : null;

  const tabs = ['products', 'portfolio', 'reviews'];

  return (
    <>
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
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {projects.map(p => {
                  const imgs = projectImages[p.id] || [];
                  const cover = imgs.length > 0 ? `${API_BASE}${imgs[0].Image}` : null;
                  return (
                    <div key={p.id} onClick={() => { setSelectedPortfolio(p); setGalleryIdx(0); }} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--gold-primary)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-secondary)' }}>
                        {cover ? (
                          <img src={cover} alt={p.projectName} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 48 }}><FiImage /></div>
                        )}
                        {imgs.length > 1 && (
                          <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiImage size={11} /> {imgs.length}
                          </span>
                        )}
                      </div>
                      <div style={{ padding: 20 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.projectName}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description || 'No description.'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Portfolio Detail Modal */}
              {selectedPortfolio && (() => {
                const imgs = projectImages[selectedPortfolio.id] || [];
                return (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedPortfolio(null)}>
                    <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 800, width: '95%', maxHeight: '90vh', overflow: 'auto', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
                      {/* Gallery */}
                      {imgs.length > 0 && (
                        <div style={{ position: 'relative' }}>
                          <img src={`${API_BASE}${imgs[galleryIdx].Image}`} alt="" style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }} />
                          {imgs.length > 1 && (
                            <>
                              <button onClick={() => setGalleryIdx(i => i === 0 ? imgs.length - 1 : i - 1)} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><FiChevronLeft /></button>
                              <button onClick={() => setGalleryIdx(i => i === imgs.length - 1 ? 0 : i + 1)} style={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><FiChevronRight /></button>
                            </>
                          )}
                        </div>
                      )}
                      <div style={{ padding: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{selectedPortfolio.projectName}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>{selectedPortfolio.description || 'No description.'}</p>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-tertiary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiImage size={14} /> {imgs.length} image{imgs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {imgs.length > 1 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
                            {imgs.map((img, i) => (
                              <div key={img.Image_id} onClick={() => setGalleryIdx(i)} style={{ width: 64, height: 64, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: i === galleryIdx ? '2px solid var(--gold-primary)' : '2px solid transparent', opacity: i === galleryIdx ? 1 : 0.6, transition: 'all 0.2s' }}>
                                <img src={`${API_BASE}${img.Image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No portfolio projects yet.</p>
        )}

        {tab === 'reviews' && (
          <div>
            {/* Submit Review — only if buyer hasn't reviewed */}
            {isBuyer && !userAlreadyReviewed && (
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
                {reviews.map((r, i) => {
                  const isOwner = isBuyer && user && r.buyer_id === user.id;
                  return (
                    <div key={r.id || i} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StarRating rating={r.rating} readonly size={16} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{r.buyerName || 'Buyer'}</span>
                          {r.editedAt && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', background: 'var(--surface-secondary)', padding: '2px 6px', borderRadius: 4 }}>Edited</span>
                          )}
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => setEditingReview(r)}
                            title="Edit your review"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <FiEdit3 size={11} /> Edit
                          </button>
                        )}
                      </div>
                      {r.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Edit Review Modal */}
    {editingReview && (
      <EditReviewModal
        review={editingReview}
        onClose={() => setEditingReview(null)}
        onSave={handleEditReview}
      />
    )}
  </>
  );
}

/* ── Edit Review Modal ───────────────────────── */
function EditReviewModal({ review, onClose, onSave }) {
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editRating) return toast.error('Please select a rating');
    setSaving(true);
    try {
      await onSave(review.id, { rating: editRating, comment: editComment });
      onClose();
    } catch { /* handled by parent */ }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', maxWidth: 520, width: '95%', animation: 'scaleIn 0.2s ease', border: '1px solid var(--surface-border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Your Review</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><FiX size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 10 }}>Rating</label>
            <StarRating rating={editRating} onRate={setEditRating} size={32} />
          </div>
          <TextArea label="Comment" value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Update your experience..." rows={4} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
