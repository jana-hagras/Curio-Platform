import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { FiSend, FiArrowLeft, FiImage, FiZap, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [apps, setApps] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const { user, isArtisan, isBuyer } = useAuth();

  const fetchData = () => {
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
  };

  useEffect(() => { fetchData(); }, [id]);

  // Poll for AI images if still processing
  useEffect(() => {
    if (!request || request.aiStatus === 'Completed' || request.aiStatus === 'Failed' || request.aiStatus === 'None') return;

    const interval = setInterval(async () => {
      try {
        const res = await requestService.getById(id);
        const updated = res.data?.request;
        if (updated) {
          setRequest(updated);
          if (updated.aiStatus === 'Completed' || updated.aiStatus === 'Failed') {
            clearInterval(interval);
          }
        }
      } catch {}
    }, 8000);

    return () => clearInterval(interval);
  }, [request?.aiStatus, id]);

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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await requestService.regenerate(id);
      toast.success('AI regeneration started! Images will appear shortly.');
      // Start polling
      setRequest(prev => ({ ...prev, aiStatus: 'Processing' }));
    } catch { toast.error('Failed to start regeneration'); }
    finally { setRegenerating(false); }
  };

  if (loading) return <Spinner />;
  if (!request) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>Request not found</h2></div>;

  const alreadyApplied = isArtisan && apps.some(a => a.artisan_id === user?.id);
  const aiImages = request.aiImages || [];
  const isOwner = isBuyer && user?.id === request.buyer_id;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16, padding: 0, fontFamily: 'inherit' }}>
            <FiArrowLeft /> Back
          </button>
        </div>

        {/* ── AI Generated Images Gallery ── */}
        {(aiImages.length > 0 || request.aiStatus === 'Processing') && (
          <div style={{
            background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)',
            padding: 24, border: '1px solid var(--surface-border)', marginBottom: 24,
            animation: 'fadeInUp 0.4s ease forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiImage size={16} />
              </div>
              <h3 style={{ fontSize: 18, margin: 0 }}>AI-Generated Previews</h3>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)',
              }}>AI GENERATED</span>
            </div>

            {request.aiStatus === 'Processing' && aiImages.length === 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12,
              }}>
                {[1, 2].map(i => (
                  <div key={i} style={{
                    height: 200, borderRadius: 12,
                    background: 'linear-gradient(110deg, var(--surface-secondary) 30%, var(--surface-primary) 50%, var(--surface-secondary) 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 8,
                  }}>
                    <FiZap style={{ color: 'var(--gold-primary)', animation: 'pulse 2s ease-in-out infinite' }} size={24} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Generating...</span>
                  </div>
                ))}
              </div>
            )}

            {aiImages.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: aiImages.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {aiImages.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    style={{
                      position: 'relative', borderRadius: 12, overflow: 'hidden',
                      cursor: 'pointer', aspectRatio: '1',
                      border: '1px solid var(--surface-border)',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <img src={url} alt={`AI Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                    }}>AI Preview {i + 1}</div>
                  </div>
                ))}
              </div>
            )}

            {request.aiStatus === 'Failed' && aiImages.length === 0 && (
              <div style={{
                padding: '24px', textAlign: 'center',
                background: 'var(--surface-secondary)', borderRadius: 12,
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
                  AI preview generation encountered an issue.
                </p>
                {isOwner && (
                  <Button size="sm" icon={FiRefreshCw} onClick={handleRegenerate} loading={regenerating}>
                    Regenerate Previews
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightboxIdx >= 0 && aiImages.length > 0 && (
          <div
            onClick={() => setLightboxIdx(-1)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.9)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              animation: 'fadeInUp 0.2s ease',
            }}
          >
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(-1); }} style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#fff', width: 40, height: 40, borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}><FiX /></button>
            {aiImages.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + aiImages.length) % aiImages.length); }} style={{
                  position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)',
                  border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}><FiChevronLeft /></button>
                <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % aiImages.length); }} style={{
                  position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)',
                  border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}><FiChevronRight /></button>
              </>
            )}
            <img
              onClick={e => e.stopPropagation()}
              src={aiImages[lightboxIdx]}
              alt="AI Preview"
              style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }}
            />
            <div style={{
              position: 'absolute', bottom: 24,
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
            }}>{lightboxIdx + 1} / {aiImages.length}</div>
          </div>
        )}

        {/* ── Request Info ── */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 28 }}>{request.title}</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              {request.category && <Badge status="Active">{request.category}</Badge>}
              <Badge status={request.status === 'Open' ? 'Pending' : request.status === 'Completed' ? 'Completed' : 'Active'}>{request.status}</Badge>
            </div>
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
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Milestones</h2>
            {milestones.map(m => (
              <div key={m.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h4 style={{ fontSize: 16 }}>{m.title}</h4><p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{m.description}</p></div>
                <div style={{ textAlign: 'right' }}><Badge status={m.status} /><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Due: {formatDate(m.dueDate)}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Applications */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)' }}>
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
            <div key={a.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{a.artisanName}</strong><Badge status={a.status} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{a.proposal}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(a.applicationDate)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shimmer animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
