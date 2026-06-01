import { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCalendar, FiDollarSign, FiArrowLeft, FiTag, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import { workshopService } from '../../services/workshopService';
import { workshopRegistrationService } from '../../services/workshopRegistrationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CardPaymentForm from '../../components/ui/CardPaymentForm';
import toast from 'react-hot-toast';
import './MentorshipsPage.css';

export default function WorkshopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isBuyer, isAuthenticated } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { t } = useTranslation(['workshop', 'common']);

  useEffect(() => {
    workshopService.getById(id)
      .then(res => setWorkshop(res.data?.workshop))
      .catch(() => toast.error(t('workshop:noWorkshops')))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && isBuyer && id) {
      workshopRegistrationService.getByBuyer(user.id)
        .then(res => {
          const regs = res.data?.registrations || [];
          setHasRegistered(regs.some(r => r.workshop_id === Number(id) && r.status !== 'Cancelled'));
        })
        .catch(() => {});
    }
  }, [user, isBuyer, id]);

  // Direct registration (for free workshops)
  const handleFreeRegister = async () => {
    setRegistering(true);
    try {
      await workshopRegistrationService.create({
        workshop_id: Number(id),
        buyer_id: user.id,
      });
      toast.success(t('workshop:registerSuccess'));
      setHasRegistered(true);
      const res = await workshopService.getById(id);
      setWorkshop(res.data?.workshop);
    } catch (err) {
      toast.error(err.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  // Paid workshop registration (after card payment)
  const handlePaidRegister = async () => {
    setRegistering(true);
    try {
      await workshopRegistrationService.create({
        workshop_id: Number(id),
        buyer_id: user.id,
      });
      toast.success(t('workshop:registerSuccess'));
      setHasRegistered(true);
      setShowPaymentModal(false);
      const res = await workshopService.getById(id);
      setWorkshop(res.data?.workshop);
    } catch (err) {
      toast.error(err.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  // Register button click handler
  const handleRegisterClick = () => {
    const isFree = !workshop.price || Number(workshop.price) === 0;
    if (isFree) {
      handleFreeRegister();
    } else {
      setShowPaymentModal(true);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', animation: 'pulse 1.5s infinite' }}>
          <div style={{ height: 32, background: 'var(--surface-tertiary)', borderRadius: 8, marginBottom: 16, width: '60%' }} />
          <div style={{ height: 200, background: 'var(--surface-tertiary)', borderRadius: 16, marginBottom: 24 }} />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>{t('workshop:noWorkshops')}</h2>
        <Button onClick={() => navigate('/workshops')} style={{ marginTop: 24 }}>{t('workshop:backToWorkshops')}</Button>
      </div>
    );
  }

  const avatarSrc = workshop.artisanProfileImage
    ? workshop.artisanProfileImage.startsWith('/') ? `${API_BASE}${workshop.artisanProfileImage}` : workshop.artisanProfileImage
    : null;

  const spotsLeft = (workshop.maxParticipants || 20) - (workshop.registrationCount || 0);
  const capacityPct = Math.min(100, ((workshop.registrationCount || 0) / (workshop.maxParticipants || 20)) * 100);
  const isFree = !workshop.price || Number(workshop.price) === 0;
  const isAccepting = workshop.status === 'Upcoming' || workshop.status === 'Ongoing';

  return (
    <div className="mentorships-page">
      <div className="mentorship-detail-container">
        <button onClick={() => navigate('/workshops')} className="mentorship-detail-back-btn">
          <FiArrowLeft size={16} className="rtl-flip" /> {t('workshop:backToWorkshops')}
        </button>

        <div className="mentorship-detail-card">
          {/* Gold banner */}
          <div className="workshop-detail-banner" />

          {/* Header */}
          <div className="mentorship-detail-header" style={{ paddingBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {workshop.category && <span className="workshop-detail-category-badge">{t('common:categories.' + workshop.category, workshop.category)}</span>}
              <Badge status={workshop.status}>{t('common:status.' + workshop.status.charAt(0).toLowerCase() + workshop.status.slice(1), workshop.status)}</Badge>
              {!isFree && (
                <span className="workshop-detail-card-payment-badge">
                  <FiCreditCard size={11} /> {t('common:nav.adminPanel') === 'Admin Panel' ? 'Card Payment Required' : 'مطلوب الدفع بالبطاقة'}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 32, marginBottom: 16 }}>{workshop.title}</h1>

            {/* Host info */}
            <div className="mentorship-detail-avatar-row" style={{ gap: 12 }}>
              <div className="mentorship-detail-avatar-wrapper" style={{ width: 44, height: 44, fontSize: 16, border: '2px solid var(--gold-primary)' }}>
                {avatarSrc ? <img src={avatarSrc} alt="" /> : (workshop.artisanName?.charAt(0) || 'A')}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>
                  {workshop.artisanName || 'Artisan Host'}
                  {workshop.artisanVerified && <FiCheckCircle size={14} style={{ marginLeft: 6, color: 'var(--gold-primary)', display: 'inline-block', verticalAlign: 'middle' }} />}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>{t('workshop:instructor')}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mentorship-detail-body">
            {/* Meta Grid */}
            <div className="mentorship-detail-meta-grid">
              {[
                { icon: FiCalendar, label: t('workshop:date'), value: workshop.workshopDate ? formatDate(workshop.workshopDate) : 'TBD' },
                { icon: FiClock, label: t('common:nav.adminPanel') === 'Admin Panel' ? 'Duration' : 'مدة الورشة', value: workshop.duration ? `${workshop.duration} ${t('common:nav.adminPanel') === 'Admin Panel' ? 'minutes' : 'دقيقة'}` : 'TBD' },
                { icon: FiDollarSign, label: t('workshop:price'), value: isFree ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Free' : 'مجاني') : formatCurrency(workshop.price) },
                { icon: FiUsers, label: t('workshop:capacity'), value: `${workshop.registrationCount || 0} / ${workshop.maxParticipants || 20}` },
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

            {/* Capacity bar */}
            <div className="workshop-detail-capacity-section">
              <div className="workshop-detail-capacity-header">
                <span style={{ color: 'var(--text-secondary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Spots filled' : 'المقاعد المحجوزة'}</span>
                <span style={{ fontWeight: 600, color: spotsLeft <= 3 ? 'var(--error)' : 'var(--text-primary)' }}>
                  {t('workshop:spotsLeft', { count: spotsLeft })}
                </span>
              </div>
              <div className="workshop-detail-capacity-bar">
                <div className="workshop-detail-capacity-fill" style={{ width: `${capacityPct}%`, background: 'var(--gold-gradient)' }} />
              </div>
            </div>

            {/* Description */}
            {workshop.description && (
              <div className="mentorship-detail-description" style={{ marginBottom: 32 }}>
                <h3 className="mentorship-detail-section-title">{t('workshop:aboutWorkshop')}</h3>
                <p>{workshop.description}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mentorship-detail-cta-panel">
              <div className="mentorship-detail-cta-price">
                <h3>
                  {isFree ? <span style={{ color: 'var(--success)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Free Workshop' : 'ورشة عمل مجانية'}</span> : formatCurrency(workshop.price)}
                </h3>
                <p className="mentorship-detail-cta-status">
                  {isAccepting ? t('workshop:spotsLeft', { count: spotsLeft }) : `${t('workshop:workshopStatus')}: ${t('common:status.' + workshop.status.charAt(0).toLowerCase() + workshop.status.slice(1), workshop.status)}`}
                </p>
              </div>

              {isAuthenticated && isBuyer ? (
                hasRegistered ? (
                  <Button variant="outline" disabled>
                    <FiCheckCircle style={{ marginRight: 6 }} /> {t('workshop:registered')}
                  </Button>
                ) : (
                  <Button onClick={handleRegisterClick} loading={registering} disabled={!isAccepting || spotsLeft <= 0}>
                    {spotsLeft <= 0 ? t('workshop:soldOut') : isFree ? t('workshop:register') : `${t('workshop:register')} — ${formatCurrency(workshop.price)}`}
                  </Button>
                )
              ) : !isAuthenticated ? (
                <Button onClick={() => navigate('/login')}>{t('workshop:signInToRegister')}</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal for paid workshops */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={t('workshop:registerModal.title')}>
        <div style={{ padding: '8px 0' }}>
          {/* Payment summary */}
          <div className="workshop-detail-payment-summary">
            <div className="workshop-detail-payment-row">
              <span style={{ color: 'var(--text-secondary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Workshop' : 'ورشة العمل'}</span>
              <span style={{ fontWeight: 600 }}>{workshop.title}</span>
            </div>
            <div className="workshop-detail-payment-row">
              <span style={{ color: 'var(--text-secondary)' }}>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Amount' : 'المبلغ'}</span>
              <span className="workshop-detail-payment-value">
                {formatCurrency(workshop.price)}
              </span>
            </div>
          </div>

          {/* Card-only notice */}
          <div className="workshop-detail-card-notice">
            <FiCreditCard size={14} />
            {t('common:nav.adminPanel') === 'Admin Panel' ? 'Workshop payments require Bank Card payment only.' : 'مدفوعات الورش التدريبية تتطلب الدفع بالبطاقة البنكية فقط.'}
          </div>

          <CardPaymentForm
            onSubmit={handlePaidRegister}
            loading={registering}
            amount={workshop.price}
          />
        </div>
      </Modal>
    </div>
  );
}

