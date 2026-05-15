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
import { FiArrowLeft, FiX, FiUpload, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function resolveImgSrc(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function EditProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
        if (!p) { toast.error('Product not found'); navigate('/dashboard/products'); return; }
        if (p.artisan_id !== user.id) { toast.error('You can only edit your own products'); navigate('/dashboard/products'); return; }
        setProduct(p);
        setForm({ item: p.item || '', description: p.description || '', price: p.price || '', availQuantity: p.availQuantity ?? '', category: p.category || CATEGORIES[0] });
        setExistingImages(p.images || []);
      } catch { toast.error('Failed to load product'); navigate('/dashboard/products'); }
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
        toast.error(`${f.name}: invalid type`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: exceeds 5MB`);
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
    if (!form.item.trim()) return toast.error('Product name is required');
    if (!form.price || Number(form.price) < 0) return toast.error('Valid price is required');
    if (form.availQuantity !== '' && Number(form.availQuantity) < 0) return toast.error('Quantity cannot be negative');

    setSaving(true);
    try {
      // Upload new images first
      const uploadedUrls = [];
      for (const file of newFiles) {
        const upRes = await uploadService.uploadImage(file);
        if (upRes.imageUrl) uploadedUrls.push(upRes.imageUrl);
      }

      const res = await marketItemService.update(Number(id), {
        item: form.item,
        description: form.description,
        price: Number(form.price),
        availQuantity: Number(form.availQuantity) || 0,
        category: form.category,
        artisan_id: user.id,
        newImages: uploadedUrls,
        removeImageIds,
      });

      toast.success('Product updated!');
      navigate('/dashboard/products');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update product';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (!product) return null;

  const keptCount = existingImages.length;
  const newCount = newFiles.length;
  const totalImages = keptCount + newCount;

  return (
    <div style={{ width: '100%', background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/dashboard/products')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>Edit Product</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Editing: {product.item}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label="Item Name *" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required />
        <Select label="Category *" options={CATEGORIES} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
        <TextArea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
        <div style={{ display: 'flex', gap: 16 }}>
          <Input type="number" label="Price (USD) *" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <Input type="number" label="Quantity *" min="0" step="1" value={form.availQuantity} onChange={e => setForm({ ...form, availQuantity: e.target.value })} required />
        </div>

        {/* ── Image Management ── */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12, color: 'var(--text-primary)' }}>
            Product Images ({totalImages})
          </label>

          {/* Existing images */}
          {(existingImages.length > 0 || removeImageIds.length > 0) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 500 }}>Current Images</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {existingImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--surface-border)' }}>
                    <img src={resolveImgSrc(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {img.isPrimary && (
                      <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, background: 'var(--gold-primary)', color: 'var(--black-deep)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Cover</span>
                    )}
                    <button type="button" onClick={() => handleRemoveExisting(img.id)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        Undo
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
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 500 }}>New Images (to be uploaded)</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {newPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--gold-primary)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, background: '#10B981', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>New</span>
                    <button type="button" onClick={() => handleRemoveNew(i)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <FiUpload size={14} /> Add Images
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleNewFiles} style={{ display: 'none' }} />
          </label>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>JPG, PNG, WEBP, GIF · Max 5MB each</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
          <Button variant="ghost" type="button" onClick={() => navigate('/dashboard/products')}>Cancel</Button>
          <Button type="submit" loading={saving} size="lg">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
