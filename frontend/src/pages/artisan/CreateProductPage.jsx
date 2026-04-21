import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item || !form.price || !form.availQuantity) return toast.error('Fill required fields');
    setLoading(true);
    try {
      await marketItemService.create({ ...form, artisan_id: user.id });
      toast.success('Product listed!');
      navigate('/dashboard/products');
    } catch (err) { toast.error('Failed to create product'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600, background: 'var(--white)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      <h1 style={{ marginBottom: 24 }}>Add New Product</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label="Item Name *" value={form.item} onChange={e => setForm({...form, item: e.target.value})} required />
        <Select label="Category *" options={CATEGORIES} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        <TextArea label="Description *" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        <div style={{ display: 'flex', gap: 16 }}>
          <Input type="number" label="Price (USD) *" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          <Input type="number" label="Quantity *" value={form.availQuantity} onChange={e => setForm({...form, availQuantity: e.target.value})} required />
        </div>
        <Input label="Image URL" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
        <Button type="submit" loading={loading} size="lg">List Product</Button>
      </form>
    </div>
  );
}
