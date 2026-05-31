import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCalendar, FiDollarSign, FiArrowLeft, FiTag, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import { workshopService } from '../../services/workshopService';
import { workshopRegistrationService } from '../../services/workshopRegistrationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CardPaymentForm from '../../components/ui/CardPaymentForm';
import toast from 'react-hot-toast';

export default function WorkshopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isBuyer, isAuthenticated } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    workshopService.getById(id)
      .then(res => setWorkshop(res.data?.workshop))
      .catch(() => toast.error('Workshop not found'))
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
      toast.success('Registered successfully!');
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
      toast.success('Payment successful! You are registered for this workshop.');
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
        <h2>Workshop not found</h2>
        <Button onClick={() => navigate('/workshops')} style={{ marginTop: 24 }}>Browse Workshops</Button>
      </div>
    );
  }

  const avatarSrc = workshop.artisanProfileImage
    ? workshop.artisanProfileImage.startsWith('/') ? `http://localhost:3000${workshop.artisanProfileImage}` : workshop.artisanProfileImage
    : null;

  const spotsLeft = (workshop.maxParticipants || 20) - (workshop.registrationCount || 0);
  const capacityPct = Math.min(100, ((workshop.registrationCount || 0) / (workshop.maxParticipants || 20)) * 100);
  const isFree = !workshop.price || Number(workshop.price) === 0;
  const isAccepting = workshop.status === 'Upcoming' || workshop.status === 'Ongoing';

  return (
    <div style={{ padding: 'var(--space-2xl) 0 var(--space-4xl)', animation: 'fadeInUp 0.4s ease forwards' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/workshops')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, fontWeight: 500 }}>
          <FiArrowLeft size={16} /> Back to Workshops
        </button>

        <div style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--surface-border)',
          overflow: 'hidden',
        }}>
          {/* Gold banner */}
          <div style={{ height: 8, background: 'var(--gold-gradient)' }} />

          {/* Header */}
          <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {workshop.category && <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', fontSize: 12, fontWeight: 600 }}>{workshop.category}</span>}
              <Badge status={workshop.status}>{workshop.status}</Badge>
              {!isFree && (
                <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCreditCard size={11} /> Card Payment Required
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 32, marginBottom: 16 }}>{workshop.title}</h1>

            {/* Host info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'var(--gold-primary)',
              }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (workshop.artisanName?.charAt(0) || 'A')}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>
                  {workshop.artisanName || 'Artisan Host'}
                  {workshop.artisanVerified && <FiCheckCircle size={14} style={{ marginLeft: 6, color: 'var(--gold-primary)' }} />}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Workshop Host</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '32px 40px' }}>
            {/* Meta Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32,
            }}>
              {[
                { icon: FiCalendar, label: 'Date', value: workshop.workshopDate ? formatDate(workshop.workshopDate) : 'TBD' },
                { icon: FiClock, label: 'Duration', value: workshop.duration ? `${workshop.duration} minutes` : 'TBD' },
                { icon: FiDollarSign, label: 'Price', value: isFree ? 'Free' : formatCurrency(workshop.price) },
                { icon: FiUsers, label: 'Capacity', value: `${workshop.registrationCount || 0} / ${workshop.maxParticipants || 20}` },
              ].map((item, i) => (
                <div key={i} style={{ padding: 20, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-primary)' }}>
                    <item.icon size={16} />
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Capacity bar */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spots filled</span>
                <span style={{ fontWeight: 600, color: spotsLeft <= 3 ? 'var(--error)' : 'var(--text-primary)' }}>
                  {spotsLeft} spots remaining
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${capacityPct}%`, background: 'var(--gold-gradient)', borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Description */}
            {workshop.description && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 12 }}>About This Workshop</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{workshop.description}</p>
              </div>
            )}

            {/* CTA */}
            <div style={{
              padding: 24, background: 'linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.03) 100%)',
              borderRadius: 'var(--radius-lg)', border: '1px solid rgba(212,168,67,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 4 }}>
                  {isFree ? <span style={{ color: 'var(--success)' }}>Free Workshop</span> : formatCurrency(workshop.price)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {isAccepting ? `${spotsLeft} spots available` : `Status: ${workshop.status}`}
                </p>
              </div>

              {isAuthenticated && isBuyer ? (
                hasRegistered ? (
                  <Button variant="outline" disabled>
                    <FiCheckCircle style={{ marginRight: 6 }} /> Registered
                  </Button>
                ) : (
                  <Button onClick={handleRegisterClick} loading={registering} disabled={!isAccepting || spotsLeft <= 0}>
                    {spotsLeft <= 0 ? 'Workshop Full' : isFree ? 'Register Now' : `Pay & Register — ${formatCurrency(workshop.price)}`}
                  </Button>
                )
              ) : !isAuthenticated ? (
                <Button onClick={() => navigate('/login')}>Sign In to Register</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal for paid workshops */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Workshop Payment">
        <div style={{ padding: '8px 0' }}>
          {/* Payment summary */}
          <div style={{
            padding: 20, marginBottom: 24,
            background: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--surface-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Workshop</span>
              <span style={{ fontWeight: 600 }}>{workshop.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--gold-primary)' }}>
                {formatCurrency(workshop.price)}
              </span>
            </div>
          </div>

          {/* Card-only notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 20,
            background: 'rgba(59, 130, 246, 0.06)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12, color: '#3B82F6',
          }}>
            <FiCreditCard size={14} />
            Workshop payments require Bank Card payment only.
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
