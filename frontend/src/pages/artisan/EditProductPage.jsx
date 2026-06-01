import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
import { uploadService } from '../../services/uploadService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { CATEGORIES } from '../../utils/constants';
import { FiArrowLeft, FiArrowRight, FiX, FiUpload, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../services/api';

function resolveImgSrc(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function EditProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['dashboard', 'common']);

  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ item: '', description: '', price: '', availQuantity: '', category: '' });

  // Image state
  const [existingImages, setExistingImages] = useState([]);   // from DB
  const [removeImageIds, setRemoveImageIds] = useState([]);    // IDs to delete
  const [newFiles, setNewFiles] = useState([]);                 // File objects to upload
  const [newPreviews, setNewPreviews] = useState([]);           // preview URLs

  useEffect(() => {
    (async () => {
      try {
        const res = await marketItemService.getById(id);
        const p = res.data?.item;
        if (!p) { toast.error(t('dashboard:products.productNotFound', 'Product not found')); navigate('/dashboard/products'); return; }
        if (p.artisan_id !== user.id) { toast.error(t('dashboard:products.onlyEditOwn', 'You can only edit your own products')); navigate('/dashboard/products'); return; }
        setProduct(p);
        setForm({ item: p.item || '', description: p.description || '', price: p.price || '', availQuantity: p.availQuantity ?? '', category: p.category || CATEGORIES[0] });
        setExistingImages(p.images || []);
      } catch { toast.error(t('dashboard:products.failedLoadProduct', 'Failed to load product')); navigate('/dashboard/products'); }
      finally { setLoading(false); }
    })();
  }, [id, user.id, navigate]);

  const handleRemoveExisting = (imgId) => {
    setRemoveImageIds(prev => [...prev, imgId]);
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
  };

  const handleUndoRemove = (imgId) => {
    setRemoveImageIds(prev => prev.filter(i => i !== imgId));
    // Re-add from product.images
    const img = product.images.find(i => i.id === imgId);
    if (img) setExistingImages(prev => [...prev, img]);
  };

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) {
        toast.error(t('dashboard:products.invalidType', { name: f.name }));
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(t('dashboard:products.exceedsSize', { name: f.name }));
        return false;
      }
      return true;
    });
    setNewFiles(prev => [...prev, ...valid]);
    setNewPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveNew = (idx) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item.trim()) return toast.error(t('dashboard:products.fillRequired', 'Product name is required'));
    if (!form.price || Number(form.price) < 0) return toast.error(t('dashboard:products.negativePrice', 'Valid price is required'));
    if (form.availQuantity !== '' && Number(form.availQuantity) < 0) return toast.error(t('dashboard:products.negativeQty', 'Quantity cannot be negative'));

    setSaving(true);
    try {
      // Upload new images first
      const uploadedUrls = [];
      for (const file of newFiles) {
        const upRes = await uploadService.uploadImage(file);
        if (upRes.imageUrl) uploadedUrls.push(upRes.imageUrl);
      }

      await marketItemService.update(Number(id), {
        item: form.item,
        description: form.description,
        price: Number(form.price),
        availQuantity: Number(form.availQuantity) || 0,
        category: form.category,
        artisan_id: user.id,
        newImages: uploadedUrls,
        removeImageIds,
      });

      toast.success(t('dashboard:products.productUpdated', 'Product updated!'));
      navigate('/dashboard/products');
    } catch (err) {
      const msg = err?.response?.data?.message || t('dashboard:products.failedUpdate', 'Failed to update product');
      toast.error(msg);
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (!product) return null;

  const categoryOptions = CATEGORIES.map(c => ({
    value: c,
    label: t('common:categories.' + c, c)
  }));

  const totalImages = existingImages.length + newFiles.length;

  return (
    <div style={{ width: '100%', background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/dashboard/products')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {isRtl ? <FiArrowRight size={18} /> : <FiArrowLeft size={18} />}
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>{t('dashboard:products.editProduct', 'Edit Product')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t('dashboard:products.editingProduct', { name: product.item })}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label={t('dashboard:products.itemName', 'Item Name *')} value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required />
        <Select label={t('dashboard:products.category', 'Category *')} options={categoryOptions} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
        <TextArea label={t('dashboard:products.descriptionOptional', 'Description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
        <div style={{ display: 'flex', gap: 16 }}>
          <Input type="number" label={t('dashboard:products.price', 'Price (USD) *')} min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <Input type="number" label={t('dashboard:products.quantity', 'Quantity *')} min="0" step="1" value={form.availQuantity} onChange={e => setForm({ ...form, availQuantity: e.target.value })} required />
        </div>

        {/* ── Image Management ── */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12, color: 'var(--text-primary)' }}>
            {t('dashboard:products.productImagesCount', { count: totalImages })}
          </label>

          {/* Existing images */}
          {(existingImages.length > 0 || removeImageIds.length > 0) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 500 }}>{t('dashboard:products.currentImages', 'Current Images')}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {existingImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--surface-border)' }}>
                    <img src={resolveImgSrc(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {img.isPrimary && (
                      <span style={{ position: 'absolute', top: 4, [isRtl ? 'right' : 'left']: 4, fontSize: 9, background: 'var(--gold-primary)', color: 'var(--black-deep)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>{t('dashboard:products.cover', 'Cover')}</span>
                    )}
                    <button type="button" onClick={() => handleRemoveExisting(img.id)}
                      style={{ position: 'absolute', top: 4, [isRtl ? 'left' : 'right']: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                {/* Show removed images as dimmed with undo */}
                {removeImageIds.map(imgId => {
                  const img = product.images.find(i => i.id === imgId);
                  if (!img) return null;
                  return (
                    <div key={`removed-${imgId}`} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px dashed var(--error)', opacity: 0.4 }}>
                      <img src={resolveImgSrc(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => handleUndoRemove(imgId)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {t('dashboard:products.dimmedUndo', 'Undo')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New images to upload */}
          {newPreviews.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 500 }}>{t('dashboard:products.newImagesUpload', 'New Images (to be uploaded)')}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {newPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--gold-primary)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 4, [isRtl ? 'right' : 'left']: 4, fontSize: 9, background: '#10B981', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>{t('dashboard:products.newBadge', 'New')}</span>
                    <button type="button" onClick={() => handleRemoveNew(i)}
                      style={{ position: 'absolute', top: 4, [isRtl ? 'left' : 'right']: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 8, border: '1px dashed var(--surface-border)', background: 'var(--surface-secondary)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            transition: 'all 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <FiUpload size={14} /> {t('dashboard:products.addImages', 'Add Images')}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleNewFiles} style={{ display: 'none' }} />
          </label>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{t('dashboard:products.imageRequirements', 'JPG, PNG, WEBP, GIF · Max 5MB each')}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
          <Button variant="ghost" type="button" onClick={() => navigate('/dashboard/products')}>{t('dashboard:products.cancel', 'Cancel')}</Button>
          <Button type="submit" loading={saving} size="lg">{t('dashboard:products.saveChanges', 'Save Changes')}</Button>
        </div>
      </form>
    </div>
  );
}
