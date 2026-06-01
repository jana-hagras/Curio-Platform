const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCheckCircle, FiCalendar, FiDollarSign, FiSend, FiArrowLeft, FiTag } from 'react-icons/fi';
import { mentorshipService } from '../../services/mentorshipService';
import { mentorshipApplicationService } from '../../services/mentorshipApplicationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import './MentorshipsPage.css';

export default function MentorshipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isBuyer, isAuthenticated } = useAuth();
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const { t } = useTranslation(['mentorship', 'common']);

  useEffect(() => {
    mentorshipService.getById(id)
      .then(res => setMentorship(res.data?.mentorship))
      .catch(() => toast.error(t('mentorship:noMentorships')))
      .finally(() => setLoading(false));
  }, [id]);

  // Check if buyer already applied
  useEffect(() => {
    if (user && isBuyer && id) {
      mentorshipApplicationService.getByBuyer(user.id)
        .then(res => {
          const apps = res.data?.applications || [];
          setHasApplied(apps.some(a => a.mentorship_id === Number(id)));
        })
        .catch(() => {});
    }
  }, [user, isBuyer, id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await mentorshipApplicationService.create({
        mentorship_id: Number(id),
        buyer_id: user.id,
        message,
      });
      toast.success(t('mentorship:applyModal.success'));
      setShowApplyModal(false);
      setHasApplied(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', animation: 'pulse 1.5s infinite' }}>
          <div style={{ height: 32, background: 'var(--surface-tertiary)', borderRadius: 8, marginBottom: 16, width: '60%' }} />
          <div style={{ height: 200, background: 'var(--surface-tertiary)', borderRadius: 16, marginBottom: 24 }} />
          <div style={{ height: 120, background: 'var(--surface-tertiary)', borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!mentorship) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>{t('mentorship:noMentorships')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('common:empty.noItems') === 'No items found' ? 'This mentorship may have been removed.' : 'ربما تم إزالة هذا البرنامج.'}
        </p>
        <Button onClick={() => navigate('/mentorships')} style={{ marginTop: 24 }}>{t('mentorship:backToMentorships')}</Button>
      </div>
    );
  }

  const avatarSrc = mentorship.artisanProfileImage
    ? mentorship.artisanProfileImage.startsWith('/') ? `${API_BASE}${mentorship.artisanProfileImage}` : mentorship.artisanProfileImage
    : null;

  return (
    <div className="mentorships-page">
      <div className="mentorship-detail-container">
        {/* Back */}
        <button onClick={() => navigate('/mentorships')} className="mentorship-detail-back-btn">
          <FiArrowLeft size={16} className="rtl-flip" /> {t('mentorship:backToMentorships')}
        </button>

        {/* Main Card */}
        <div className="mentorship-detail-card">
          {/* Header with gradient */}
          <div className="mentorship-detail-header">
            <div className="mentorship-detail-avatar-row">
              {/* Avatar */}
              <div className="mentorship-detail-avatar-wrapper">
                {avatarSrc ? <img src={avatarSrc} alt="" /> : (mentorship.artisanName?.charAt(0) || 'M')}
              </div>

              <div className="mentorship-detail-profile-info">
                <div className="mentorship-detail-title-row">
                  <h1>{mentorship.artisanName || 'Artisan Mentor'}</h1>
                  {mentorship.artisanVerified && (
                    <span className="mentorship-detail-verified-badge">
                      <FiCheckCircle size={16} /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'Verified' : 'حساب موثق'}
                    </span>
                  )}
                </div>
                {mentorship.artisanBio && (
                  <p className="mentorship-detail-bio">{mentorship.artisanBio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mentorship-detail-body">
            {/* Meta Grid */}
            <div className="mentorship-detail-meta-grid">
              {[
                { icon: FiTag, label: t('mentorship:categoryLabel'), value: t('common:categories.' + mentorship.category, mentorship.category || 'General') },
                { icon: FiClock, label: t('mentorship:duration'), value: `${mentorship.duration} ${t('common:nav.adminPanel') === 'Admin Panel' ? 'minutes' : 'دقيقة'}` },
                { icon: FiDollarSign, label: t('mentorship:sessionPrice'), value: formatCurrency(mentorship.sessionPrice) },
                { icon: FiUsers, label: t('mentorship:students'), value: t('mentorship:oneOnOne') },
                { icon: FiCalendar, label: t('mentorship:startDateLabel'), value: mentorship.startDate ? formatDate(mentorship.startDate) : t('mentorship:flexible') },
              ].map((item, i) => (
                <div key={i} className="mentorship-detail-meta-card">
                  <div className="mentorship-detail-meta-header">
                    <item.icon size={16} />
                    <span className="mentorship-detail-meta-label">{item.label}</span>
                  </div>
                  <p className="mentorship-detail-meta-value">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {mentorship.description && (
              <div className="mentorship-detail-description" style={{ marginBottom: 32 }}>
                <h3 className="mentorship-detail-section-title">{t('mentorship:aboutMentorship')}</h3>
                <p>{mentorship.description}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mentorship-detail-cta-panel">
              <div className="mentorship-detail-cta-price">
                <h3>
                  {formatCurrency(mentorship.sessionPrice)} <span>{t('mentorship:perSession') ? ` / ${t('mentorship:perSession')}` : ' / session'}</span>
                </h3>
                <p className="mentorship-detail-cta-status">
                  {mentorship.status === 'Active' ? t('mentorship:acceptingStudents') : `${t('mentorship:statusLabel')}: ${t('common:status.' + mentorship.status.charAt(0).toLowerCase() + mentorship.status.slice(1), mentorship.status)}`}
                </p>
              </div>

              {isAuthenticated && isBuyer ? (
                hasApplied ? (
                  <Button variant="outline" disabled>{t('mentorship:alreadyApplied')}</Button>
                ) : (
                  <Button icon={FiSend} onClick={() => setShowApplyModal(true)} disabled={mentorship.status !== 'Active'}>
                    {t('mentorship:applyMentorship')}
                  </Button>
                )
              ) : !isAuthenticated ? (
                <Button onClick={() => navigate('/login')}>{t('mentorship:signInToApply')}</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title={t('mentorship:applyModal.title')}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {t('common:nav.adminPanel') === 'Admin Panel' 
              ? <>Send a message to <strong>{mentorship.artisanName}</strong> explaining why you'd like to learn from them.</> 
              : <>أرسل رسالة إلى <strong>{mentorship.artisanName}</strong> توضح فيها لماذا ترغب في التعلم والتدرب على يديه.</>}
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('mentorship:applyModal.placeholder')}
            rows={5}
            className="mentorship-detail-textarea"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <Button variant="ghost" onClick={() => setShowApplyModal(false)}>{t('common:actions.cancel') || 'Cancel'}</Button>
            <Button onClick={handleApply} loading={applying} icon={FiSend}>{t('mentorship:applyModal.submit')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

