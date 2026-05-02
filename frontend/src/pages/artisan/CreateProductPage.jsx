import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
import { uploadService } from '../../services/uploadService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function CreateProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ item: '', description: '', price: '', availQuantity: '', category: CATEGORIES[0], image: '' });
  const [imageFile, setImageFile] = useState(null);

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item || !form.price || !form.availQuantity) return toast.error('Fill required fields');
    if (Number(form.price) < 0) return toast.error('Price cannot be negative');
    if (Number(form.availQuantity) < 0) return toast.error('Quantity cannot be negative');
    setLoading(true);
    try {
      let finalImageUrl = form.image;
      
      if (imageFile) {
        const uploadRes = await uploadService.uploadImage(imageFile);
        if (uploadRes.ok && uploadRes.imageUrl) {
          finalImageUrl = uploadRes.imageUrl;
        } else {
          throw new Error("Upload failed");
        }
      }

      await marketItemService.create({ 
        ...form, 
        images: finalImageUrl ? [finalImageUrl] : [], 
        artisan_id: user.id 
      });
      toast.success('Product listed!');
      navigate('/dashboard/products');
    } catch (err) { toast.error('Failed to create product'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600, background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      <h1 style={{ marginBottom: 24 }}>Add New Product</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label="Item Name *" value={form.item} onChange={e => setForm({...form, item: e.target.value})} required />
        <Select label="Category *" options={CATEGORIES} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        <TextArea label="Description *" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        <div style={{ display: 'flex', gap: 16 }}>
          <Input type="number" label="Price (USD) *" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          <Input type="number" label="Quantity *" min="0" step="1" value={form.availQuantity} onChange={e => setForm({...form, availQuantity: e.target.value})} required />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageFileChange} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Or provide an image URL below (e.g. Unsplash URL)</p>
          <Input placeholder="https://images.unsplash.com/photo-..." value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
          {(imageFile || form.image) && (
             <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>Image selected!</p>
             </div>
          )}
        </div>

        <Button type="submit" loading={loading} size="lg">List Product</Button>
      </form>
    </div>
  );
}
