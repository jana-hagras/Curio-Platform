import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import { milestoneService } from '../../services/milestoneService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiSend, FiArrowLeft, FiImage, FiZap, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight, FiStar, FiLayers, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '@google/model-viewer';

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
  const [versions, setVersions] = useState([]);
  const [refinementText, setRefinementText] = useState('');
  const [refining, setRefining] = useState(false);
  const [settingPreferred, setSettingPreferred] = useState(false);
  const { user, isArtisan, isBuyer } = useAuth();
  const { t } = useTranslation(['request', 'common']);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      requestService.getById(id),
      applicationService.getByRequest(id).catch(() => ({ data: { applications: [] } })),
      milestoneService.getByRequest(id).catch(() => ({ data: { milestones: [] } })),
      requestService.getVersions(id).catch(() => ({ data: { versions: [] } })),
    ]).then(([rRes, aRes, mRes, vRes]) => {
      setRequest(rRes.data?.request);
      setApps(aRes.data?.applications || []);
      setMilestones(mRes.data?.milestones || []);
      setVersions(vRes.data?.versions || []);
    }).catch(() => toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to load' : 'فشل التحميل'))
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
            const vRes = await requestService.getVersions(id);
            setVersions(vRes.data?.versions || []);
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
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Application submitted!' : 'تم تقديم طلب التقديم بنجاح!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await requestService.regenerate(id);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'AI regeneration started!' : 'بدأ إعادة توليد الذكاء الاصطناعي!');
      setRequest(prev => ({ ...prev, aiStatus: 'Processing' }));
    } catch { toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to start regeneration' : 'فشل بدء إعادة التوليد'); }
    finally { setRegenerating(false); }
  };

  const handleRefine = async () => {
    if (!refinementText.trim()) return;
    setRefining(true);
    try {
      await requestService.refine(id, refinementText.trim());
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Refinement started! New version will appear shortly.' : 'بدأ التعديل! ستظهر النسخة الجديدة قريباً.');
      setRefinementText('');
      setRequest(prev => ({ ...prev, aiStatus: 'Processing' }));
    } catch { toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to start refinement' : 'فشل بدء التعديل'); }
    finally { setRefining(false); }
  };

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:7000';
    return `${apiBase}${path}`;
  };

  const get3DModelUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      return `${apiBase}/requests/proxy-3d?url=${encodeURIComponent(path)}`;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:7000';
    return `${apiBase}${path}`;
  };

  const handleSetPreferred = async (generationId) => {
    setSettingPreferred(true);
    try {
      await requestService.setPreferred(generationId);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Preferred design updated!' : 'تم تحديث التصميم المفضل!');
      const [rRes, vRes] = await Promise.all([requestService.getById(id), requestService.getVersions(id)]);
      setRequest(rRes.data?.request);
      setVersions(vRes.data?.versions || []);
    } catch { toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to set preferred' : 'فشل تحديد التصميم المفضل'); }
    finally { setSettingPreferred(false); }
  };

  const [settingFinal, setSettingFinal] = useState(false);

  const handleSelectFinal = async (generationId) => {
    if (!window.confirm(t('common:nav.adminPanel') === 'Admin Panel' ? "Are you sure you want to select this design as the final design? This will disable further refinements and regenerations." : "هل أنت متأكد أنك تريد اختيار هذا التصميم كتصميم نهائي؟ سيؤدي ذلك إلى تعطيل أي تعديلات أو توليد جديد.")) return;
    setSettingFinal(true);
    try {
      await requestService.selectFinal(generationId);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? 'Final design selected!' : 'تم اختيار التصميم النهائي!');
      const [rRes, vRes] = await Promise.all([requestService.getById(id), requestService.getVersions(id)]);
      setRequest(rRes.data?.request);
      setVersions(vRes.data?.versions || []);
    } catch { toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed to select final design' : 'فشل اختيار التصميم النهائي'); }
    finally { setSettingFinal(false); }
  };

  if (loading) return <Spinner />;
  if (!request) return <div className="container" style={{ padding: 60, textAlign: 'center' }}><h2>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Request not found' : 'الطلب غير موجود'}</h2></div>;

  const alreadyApplied = isArtisan && apps.some(a => a.artisan_id === user?.id);
  const allImages = versions.flatMap(v => v.images || []);
  const lightboxImages = allImages.length > 0 ? allImages : (request.aiImages || []);
  const isOwner = isBuyer && user?.id === request.buyer_id;
  const hasProcessing = request.aiStatus === 'Processing';
  const preferredImg = request.preferredImage;

  // ── Artisan View: show only preferred design ──
  if (isArtisan) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16, padding: 0, fontFamily: 'inherit' }}>
              <FiArrowLeft className="rtl-flip" /> {t('common:actions.back') || 'Back'}
            </button>
          </div>

          {/* Preferred / Primary Design */}
          {preferredImg && (
            <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {request.finalGenerationId ? '🏆' : <FiStar size={16} />}
                </div>
                <h3 style={{ fontSize: 18, margin: 0 }}>
                  {request.imageSourceType === 'Upload' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Uploaded Reference Image' : 'صورة مرجعية مرفوعة') : request.finalGenerationId ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Final Selected Design' : 'التصميم النهائي المختار') : (t('common:nav.adminPanel') === 'Admin Panel' ? 'Reference Design' : 'تصميم مرجعي')}
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', border: request.finalGenerationId ? '1px solid var(--gold-primary)' : 'none' }}>
                  {request.imageSourceType === 'Upload' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'REFERENCE' : 'مرجع') : request.finalGenerationId ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'FINAL SELECTED DESIGN' : 'التصميم النهائي المختار') : (t('common:nav.adminPanel') === 'Admin Panel' ? 'PREFERRED' : 'مفضل')}
                </span>
              </div>
              <div style={{ borderRadius: 12, overflow: 'hidden', maxWidth: 500 }}>
                {request.preferredModelGlbUrl ? (
                  <div style={{ width: '100%', height: 400, borderRadius: 12, overflow: 'hidden', background: '#121212', border: '1px solid var(--surface-border)', position: 'relative' }}>
                    <model-viewer
                      src={get3DModelUrl(request.preferredModelGlbUrl)}
                      poster={getFullImageUrl(preferredImg)}
                      alt={t('request:ai3D', '3D design model')}
                      auto-rotate
                      camera-controls
                      shadow-intensity="1"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                  </div>
                ) : (
                  <img src={getFullImageUrl(preferredImg)} alt={t('common:nav.adminPanel') === 'Admin Panel' ? 'Preferred design' : 'التصميم المفضل'} style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
                )}
              </div>
            </div>
          )}

          {/* Request Info */}
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h1 style={{ fontSize: 28 }}>{request.title}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                {request.category && <Badge status="Active">{t('common:categories.' + request.category, request.category)}</Badge>}
                <Badge status={request.status === 'Open' ? 'Pending' : request.status === 'Completed' ? 'Completed' : 'Active'}>
                  {request.status === 'Open' ? (t('request:open', 'Open')) : request.status}
                </Badge>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{request.description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15 }}>
              <span><strong>{t('request:budget', 'Budget')}:</strong> {formatCurrency(request.budget)}</span>
              <span><strong>{t('request:deadline', 'Deadline')}:</strong> {formatDate(request.requestDate)}</span>
              <span><strong>{t('common:nav.adminPanel') === 'Admin Panel' ? 'By' : 'بواسطة'}:</strong> {request.buyerName}</span>
            </div>
          </div>

          {/* Apply */}
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)' }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>{t('request:apply', 'Apply to this Request')}</h2>
            {!alreadyApplied ? (
              <form onSubmit={handleApply} style={{ padding: 20, background: 'var(--sand-light)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: 12 }}>{t('request:proposal', 'Submit Your Proposal')}</h4>
                <TextArea placeholder={t('request:proposalPlaceholder', 'Describe how you would fulfill this request...')} value={proposal} onChange={e => setProposal(e.target.value)} rows={3} />
                <Button type="submit" icon={FiSend} loading={submitting} style={{ marginTop: 12 }}>{t('request:submitApplication', 'Apply')}</Button>
              </form>
            ) : (
              <p style={{ color: 'var(--success)', fontWeight: 600 }}>{t('request:applied', '✓ You have already applied')}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Buyer / Public View ──
  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16, padding: 0, fontFamily: 'inherit' }}>
            <FiArrowLeft className="rtl-flip" /> {t('common:actions.back') || 'Back'}
          </button>
        </div>

        {/* Preferred / Primary Design */}
        {preferredImg && (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {request.finalGenerationId ? '🏆' : <FiStar size={16} />}
              </div>
              <h3 style={{ fontSize: 18, margin: 0 }}>
                {request.imageSourceType === 'Upload' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Uploaded Reference Image' : 'صورة مرجعية مرفوعة') : request.finalGenerationId ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Final Selected Design' : 'التصميم النهائي المختار') : (t('common:nav.adminPanel') === 'Admin Panel' ? 'Reference Design' : 'تصميم مرجعي')}
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', border: request.finalGenerationId ? '1px solid var(--gold-primary)' : 'none' }}>
                {request.imageSourceType === 'Upload' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'REFERENCE' : 'مرجع') : request.finalGenerationId ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'FINAL SELECTED DESIGN' : 'التصميم النهائي المختار') : (t('common:nav.adminPanel') === 'Admin Panel' ? 'PREFERRED' : 'مفضل')}
              </span>
            </div>
             <div style={{ borderRadius: 12, overflow: 'hidden', maxWidth: 500 }}>
                {request.preferredModelGlbUrl ? (
                  <div style={{ width: '100%', height: 400, borderRadius: 12, overflow: 'hidden', background: '#121212', border: '1px solid var(--surface-border)', position: 'relative' }}>
                    <model-viewer
                      src={get3DModelUrl(request.preferredModelGlbUrl)}
                      poster={getFullImageUrl(preferredImg)}
                      alt={t('request:ai3D', '3D design model')}
                      auto-rotate
                      camera-controls
                      shadow-intensity="1"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                  </div>
                ) : (
                  <img src={getFullImageUrl(preferredImg)} alt={t('common:nav.adminPanel') === 'Admin Panel' ? 'Reference design' : 'تصميم مرجعي'} style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
                )}
              </div>
          </div>
        )}

        {/* ── Version Gallery ── */}
        {request.imageSourceType === 'AI' && (versions.length > 0 || hasProcessing) && (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--surface-border)', marginBottom: 24, animation: 'fadeInUp 0.4s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiImage size={16} />
              </div>
              <h3 style={{ fontSize: 18, margin: 0 }}>{t('request:versions', 'AI Design Versions')}</h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)' }}>
                {versions.length} {versions.length !== 1 ? t('request:versions', 'Versions') : t('request:version', 'Version')}
              </span>
            </div>

            {/* Processing skeleton */}
            {hasProcessing && versions.every(v => v.status !== 'Completed') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: versions.length > 0 ? 20 : 0 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ height: 200, borderRadius: 12, background: 'linear-gradient(110deg, var(--surface-secondary) 30%, var(--surface-primary) 50%, var(--surface-secondary) 70%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <FiZap style={{ color: 'var(--gold-primary)', animation: 'pulse 2s ease-in-out infinite' }} size={24} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('request:generating', 'Generating new version...')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Version cards */}
            {versions.filter(v => v.images?.length > 0 || v.status === 'Failed').map(v => {
              const hasFinalInVersion = request.finalGenerationId && v.generations?.some(g => g.id === request.finalGenerationId);
              return (
                <div key={v.versionNumber} style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', border: hasFinalInVersion ? '2px solid var(--gold-primary)' : v.isPreferred ? '2px solid var(--gold-primary)' : '1px solid var(--surface-border)', background: hasFinalInVersion ? 'rgba(212,168,67,0.04)' : v.isPreferred ? 'rgba(212,168,67,0.02)' : 'transparent', transition: 'all 0.2s' }}>
                  {/* Version header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <FiLayers size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{t('request:version', 'Version')} {v.versionNumber}</span>
                    {hasFinalInVersion ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--gold-primary)' }}>
                        🏆 {t('common:nav.adminPanel') === 'Admin Panel' ? 'Final Selected Design' : 'التصميم النهائي المختار'}
                      </span>
                    ) : v.isPreferred ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(212,168,67,0.12)', color: 'var(--gold-primary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <FiStar size={10} /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'Preferred' : 'المفضلة'}
                      </span>
                    ) : null}
                    {v.status === 'Failed' && <Badge status="Failed">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Failed' : 'فشلت'}</Badge>}
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{formatDate(v.createdAt)}</span>
                    
                    {/* Buyer actions: Set Preferred / Select Final */}
                    {isOwner && !request.finalGenerationId && v.images?.length > 0 && (
                       <div style={{ display: 'flex', gap: 8 }}>
                        {!v.isPreferred && (
                          <button onClick={() => handleSetPreferred(v.generations[0]?.id)} disabled={settingPreferred || settingFinal} style={{ background: 'none', border: '1px solid var(--surface-border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                            <FiStar size={11} /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'Set Preferred' : 'تحديد كمفضل'}
                          </button>
                        )}
                        <button onClick={() => handleSelectFinal(v.generations[0]?.id)} disabled={settingPreferred || settingFinal} style={{ background: 'var(--gold-primary)', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                          🏆 {t('common:nav.adminPanel') === 'Admin Panel' ? 'Select as Final' : 'اختيار كنهائي'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Refinement instruction */}
                  {v.refinementPrompt && (
                    <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(139,92,246,0.06)', borderRadius: 8, borderLeft: '3px solid #8B5CF6' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Refinement' : 'تحسين/تعديل'}</span>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{v.refinementPrompt}</p>
                    </div>
                  )}

                  {/* Images / 3D model grid */}
                  {v.images?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: v.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {v.images.map((url, i) => {
                        const globalIdx = lightboxImages.indexOf(url);
                        const hasModel = v.modelGlbUrl;
                        return (
                          <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--surface-border)', transition: 'all 0.2s', background: '#121212' }} onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            {hasModel ? (
                              <model-viewer
                                src={get3DModelUrl(v.modelGlbUrl)}
                                poster={url}
                                alt={`V${v.versionNumber} ${t('request:ai3D', '3D Model')}`}
                                auto-rotate
                                camera-controls
                                shadow-intensity="1"
                                style={{ width: '100%', height: '100%', display: 'block' }}
                              />
                            ) : (
                              <img src={url} alt={`V${v.versionNumber} Preview ${i + 1}`} onClick={() => setLightboxIdx(globalIdx >= 0 ? globalIdx : 0)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                            )}
                            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', pointerEvents: 'none' }}>
                              V{v.versionNumber} {hasModel ? `· ${t('request:ai3D', '3D Model')}` : `· ${i + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Failed state */}
            {request.aiStatus === 'Failed' && versions.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', background: 'var(--surface-secondary)', borderRadius: 12 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'AI preview generation encountered an issue.' : 'واجه توليد معاينة الذكاء الاصطناعي مشكلة.'}</p>
                {isOwner && !request.finalGenerationId && <Button size="sm" icon={FiRefreshCw} onClick={handleRegenerate} loading={regenerating}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Regenerate Previews' : 'إعادة توليد المعاينات'}</Button>}
              </div>
            )}

            {/* ── Refinement Panel (owner only) ── */}
            {isOwner && !request.finalGenerationId && versions.some(v => v.images?.length > 0) && (
              <div style={{ marginTop: 20, padding: 20, borderRadius: 'var(--radius-md)', background: 'var(--surface-secondary)', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FiEdit3 size={15} style={{ color: 'var(--gold-primary)' }} />
                  <h4 style={{ margin: 0, fontSize: 15 }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Refine Design' : 'تعديل التصميم'}</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Describe changes to generate a new version' : 'صف التغييرات لتوليد نسخة جديدة'}</span>
                </div>
                <TextArea placeholder={t('common:nav.adminPanel') === 'Admin Panel' ? "e.g. Make it more ornate, add gold leaf details, change to a darker wood tone..." : "مثال: اجعلها أكثر زخرفة، أضف تفاصيل أوراق الذهب، غيّر إلى خشب بلون أغمق..."} value={refinementText} onChange={e => setRefinementText(e.target.value)} rows={2} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Button size="sm" icon={FiZap} onClick={handleRefine} loading={refining} disabled={!refinementText.trim()}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Generate New Version' : 'توليد نسخة جديدة'}</Button>
                  <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={handleRegenerate} loading={regenerating}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Regenerate Current' : 'إعادة توليد النسخة الحالية'}</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightboxIdx >= 0 && lightboxImages.length > 0 && (
          <div onClick={() => setLightboxIdx(-1)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeInUp 0.2s ease' }}>
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(-1); }} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><FiX /></button>
            {lightboxImages.length > 1 && (<>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + lightboxImages.length) % lightboxImages.length); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><FiChevronLeft className="rtl-flip" /></button>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % lightboxImages.length); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><FiChevronRight className="rtl-flip" /></button>
            </>)}
            <img onClick={e => e.stopPropagation()} src={lightboxImages[lightboxIdx]} alt="AI Preview" style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>{lightboxIdx + 1} / {lightboxImages.length}</div>
          </div>
        )}

        {/* ── Request Info ── */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 28 }}>{request.title}</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              {request.category && <Badge status="Active">{t('common:categories.' + request.category, request.category)}</Badge>}
              <Badge status={request.status === 'Open' ? 'Pending' : request.status === 'Completed' ? 'Completed' : 'Active'}>
                {request.status === 'Open' ? (t('request:open', 'Open')) : request.status}
              </Badge>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{request.description}</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 15 }}>
            <span><strong>{t('request:budget', 'Budget')}:</strong> {formatCurrency(request.budget)}</span>
            <span><strong>{t('request:deadline', 'Deadline')}:</strong> {formatDate(request.requestDate)}</span>
            <span><strong>{t('common:nav.adminPanel') === 'Admin Panel' ? 'By' : 'بواسطة'}:</strong> {request.buyerName}</span>
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>{t('request:milestones', 'Milestones')}</h2>
            {milestones.map(m => (
              <div key={m.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h4 style={{ fontSize: 16 }}>{m.title}</h4><p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{m.description}</p></div>
                <div style={{ textAlign: 'right' }}><Badge status={m.status} /><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t('request:deadline', 'Due')}: {formatDate(m.dueDate)}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Applications */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1px solid var(--surface-border)' }}>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>{t('request:applications', 'Applications')} ({apps.length})</h2>
          {apps.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>{t('request:noApplications', 'No applications yet.')}</p> : apps.map(a => (
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

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

