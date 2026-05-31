import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { CATEGORIES } from '../../utils/constants';
import { FiSend, FiZap, FiImage, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PHASE = { FORM: 'form', PROCESSING: 'processing', SUCCESS: 'success' };

export default function CreateRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(PHASE.FORM);
  const [createdId, setCreatedId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', budget: '', category: CATEGORIES[0], url3DModel: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget) return toast.error('Fill all required fields');
    if (Number(form.budget) < 1) return toast.error('Budget must be at least $1 USD');
    setLoading(true);
    setPhase(PHASE.PROCESSING);
    try {
      const res = await requestService.create({ ...form, buyer_id: user.id, requestDate: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      const newId = res.data?.request?.id;
      setCreatedId(newId);
      setTimeout(() => {
        setPhase(PHASE.SUCCESS);
      }, 2200);
    } catch (err) {
      toast.error('Failed to create request');
      setPhase(PHASE.FORM);
    } finally {
      setLoading(false);
    }
  };

  // ── Processing Animation ──
  if (phase === PHASE.PROCESSING) {
    return (
      <div style={{ width: '100%', background: 'var(--surface-primary)', padding: 48, borderRadius: 'var(--radius-lg)', boxSizing: 'border-box', textAlign: 'center' }}>
        <div style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 24px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <FiZap size={36} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>AI is working its magic ✨</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            Your request has been saved. Our AI is enhancing your description and generating visual previews for artisans...
          </p>

          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 340, margin: '0 auto' }}>
            {[
              { icon: FiCheckCircle, label: 'Request saved successfully', done: true },
              { icon: FiZap, label: 'Enhancing description with AI...', done: false, active: true },
              { icon: FiImage, label: 'Generating visual previews...', done: false },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: step.done ? 1 : step.active ? 1 : 0.4,
                animation: step.active ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: step.done ? 'rgba(16,185,129,0.12)' : step.active ? 'rgba(212,168,67,0.12)' : 'var(--surface-secondary)',
                  color: step.done ? '#10B981' : step.active ? 'var(--gold-primary)' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  <step.icon />
                </div>
                <span style={{
                  fontSize: 14, fontWeight: step.done || step.active ? 600 : 400,
                  color: step.done ? '#10B981' : step.active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Success State ──
  if (phase === PHASE.SUCCESS) {
    return (
      <div style={{ width: '100%', background: 'var(--surface-primary)', padding: 48, borderRadius: 'var(--radius-lg)', boxSizing: 'border-box', textAlign: 'center', animation: 'fadeInUp 0.5s ease forwards' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 24px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FiCheckCircle size={36} style={{ color: '#10B981' }} />
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Request Created Successfully! 🎉</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 440, margin: '0 auto 32px' }}>
          Your custom request is live. AI-generated visual previews will appear on your request page shortly — artisans can already see and respond to your request.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate(`/requests/${createdId}`)} size="lg">
            View Request
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/requests')} size="lg">
            My Requests
          </Button>
        </div>
      </div>
    );
  }

  // ── Form State ──
  return (
    <div style={{ width: '100%', background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Create Custom Request</h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.03))',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,168,67,0.15)',
        }}>
          <FiZap style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--gold-primary)' }}>AI-Powered:</strong> Describe what you want and our AI will automatically generate visual previews to help artisans understand your vision.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input label="Title *" placeholder="E.g., Custom ceramic vase with Egyptian motifs" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <Select label="Category *" options={CATEGORIES} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
        <TextArea
          label="Description *"
          placeholder="Describe your ideal product in detail — materials, colors, size, style, purpose. The more detail you provide, the better the AI previews will be..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={5}
          required
        />
        <Input type="number" min="1" step="0.01" label="Budget (USD) *" placeholder="Enter your budget" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />
        <Input label="3D Model URL (Optional)" placeholder="Link to existing 3D model reference" value={form.url3DModel} onChange={e => setForm({ ...form, url3DModel: e.target.value })} />
        <Button type="submit" loading={loading} size="lg" icon={FiSend}>Submit Request</Button>
      </form>
    </div>
  );
}
