import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { portfolioService } from '../../services/portfolioService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import { FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function MyPortfolioPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    portfolioService.getAll()
      .then(res => setProjects((res.data.projects || []).filter(p => p.artisan_id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectName) return toast.error('Project name is required');
    setSubmitting(true);
    try {
      await portfolioService.create({ ...form, artisan_id: user.id });
      toast.success('Project added!');
      setForm({ projectName: '', description: '' });
      fetchProjects();
    } catch { toast.error('Failed to add project'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await portfolioService.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Portfolio</h1>
      
      <div style={{ background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)', marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Add New Project</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Project Name" value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} required />
          <TextArea label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Button type="submit" loading={submitting} style={{ alignSelf: 'flex-start' }}>Add Project</Button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{p.projectName}</h3>
              <button onClick={() => handleDelete(p.id)} style={{ color: 'var(--error)' }}><FiTrash2 /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
