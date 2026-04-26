import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function CreateRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: '', category: CATEGORIES[0], url3DModel: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.budget) return toast.error('Fill required fields');
    setLoading(true);
    try {
      await requestService.create({ ...form, buyer_id: user.id, requestDate: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      toast.success('Request created!');
      navigate('/dashboard/requests');
    } catch (err) { toast.error('Failed to create request'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600, background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)' }}>
      <h1 style={{ marginBottom: 24 }}>Create Custom Request</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <Select label="Category *" options={CATEGORIES} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        <TextArea label="Description *" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        <Input type="number" label="Budget (USD) *" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} required />
        <Input label="3D Model URL (Optional)" value={form.url3DModel} onChange={e => setForm({...form, url3DModel: e.target.value})} />
        <Button type="submit" loading={loading} size="lg">Submit Request</Button>
      </form>
    </div>
  );
}
