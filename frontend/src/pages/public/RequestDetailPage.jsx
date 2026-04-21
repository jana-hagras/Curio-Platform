import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import { milestoneService } from '../../services/milestoneService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [apps, setApps] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isArtisan } = useAuth();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      requestService.getById(id),
      applicationService.getByRequest(id).catch(() => ({ data: { applications: [] } })),
      milestoneService.getByRequest(id).catch(() => ({ data: { milestones: [] } })),
    ]).then(([rRes, aRes, mRes]) => {
      setRequest(rRes.data?.request);
      setApps(aRes.data?.applications || []);
      setMilestones(mRes.data?.milestones || []);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await applicationService.create({ request_id: Number(id), artisan_id: user.id, proposal });
      setApps(prev => [...prev, res.data.application]);
      setProposal('');
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!request) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>Request not found</h2></div>;

  const alreadyApplied = isArtisan && apps.some(a => a.artisan_id === user?.id);

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--sand-warm)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 28 }}>{request.title}</h1>
            {request.category && <Badge status="Active">{request.category}</Badge>}
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{request.description}</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15 }}>
            <span><strong>Budget:</strong> {formatCurrency(request.budget)}</span>
            <span><strong>Date:</strong> {formatDate(request.requestDate)}</span>
            <span><strong>By:</strong> {request.buyerName}</span>
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--sand-warm)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Milestones</h2>
            {milestones.map(m => (
              <div key={m.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--sand-warm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h4 style={{ fontSize: 16 }}>{m.title}</h4><p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{m.description}</p></div>
                <div style={{ textAlign: 'right' }}><Badge status={m.status} /><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Due: {formatDate(m.dueDate)}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Applications */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--sand-warm)' }}>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Applications ({apps.length})</h2>
          {isArtisan && !alreadyApplied && (
            <form onSubmit={handleApply} style={{ marginBottom: 24, padding: 20, background: 'var(--sand-light)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ marginBottom: 12 }}>Submit Your Proposal</h4>
              <TextArea placeholder="Describe how you would fulfill this request..." value={proposal} onChange={e => setProposal(e.target.value)} rows={3} />
              <Button type="submit" icon={FiSend} loading={submitting} style={{ marginTop: 12 }}>Apply</Button>
            </form>
          )}
          {alreadyApplied && <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: 16 }}>✓ You have already applied</p>}
          {apps.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No applications yet.</p> : apps.map(a => (
            <div key={a.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--sand-warm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{a.artisanName}</strong><Badge status={a.status} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{a.proposal}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(a.applicationDate)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
