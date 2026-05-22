import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCheckCircle, FiCalendar, FiDollarSign, FiSend, FiArrowLeft, FiTag } from 'react-icons/fi';
import { mentorshipService } from '../../services/mentorshipService';
import { mentorshipApplicationService } from '../../services/mentorshipApplicationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    mentorshipService.getById(id)
      .then(res => setMentorship(res.data?.mentorship))
      .catch(() => toast.error('Mentorship not found'))
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
      toast.success('Application submitted successfully!');
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
        <h2>Mentorship not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>This mentorship may have been removed.</p>
        <Button onClick={() => navigate('/mentorships')} style={{ marginTop: 24 }}>Browse Mentorships</Button>
      </div>
    );
  }

  const avatarSrc = mentorship.artisanProfileImage
    ? mentorship.artisanProfileImage.startsWith('/') ? `http://localhost:3000${mentorship.artisanProfileImage}` : mentorship.artisanProfileImage
    : null;

  return (
    <div style={{ padding: 'var(--space-2xl) 0 var(--space-4xl)', animation: 'fadeInUp 0.4s ease forwards' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back */}
        <button onClick={() => navigate('/mentorships')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, fontWeight: 500 }}>
          <FiArrowLeft size={16} /> Back to Mentorships
        </button>

        {/* Main Card */}
        <div style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--surface-border)',
          overflow: 'hidden',
        }}>
          {/* Header with gradient */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(212,168,67,0.04) 100%)',
            padding: '40px 40px 32px',
            borderBottom: '1px solid var(--surface-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: 'var(--gold-primary)',
                border: '3px solid var(--gold-primary)',
              }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (mentorship.artisanName?.charAt(0) || 'M')}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 28, margin: 0 }}>{mentorship.artisanName || 'Artisan Mentor'}</h1>
                  {mentorship.artisanVerified && (
                    <span style={{ color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600 }}>
                      <FiCheckCircle size={16} /> Verified
                    </span>
                  )}
                </div>
                {mentorship.artisanBio && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5, marginTop: 8 }}>{mentorship.artisanBio}</p>
                )}
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
                { icon: FiTag, label: 'Category', value: mentorship.category || 'General' },
                { icon: FiClock, label: 'Duration', value: `${mentorship.duration} minutes` },
                { icon: FiDollarSign, label: 'Session Price', value: formatCurrency(mentorship.sessionPrice) },
                { icon: FiUsers, label: 'Students', value: `${mentorship.applicationCount || 0} / ${mentorship.maxStudents || 10}` },
                { icon: FiCalendar, label: 'Start Date', value: mentorship.startDate ? formatDate(mentorship.startDate) : 'Flexible' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: 20, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-primary)' }}>
                    <item.icon size={16} />
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {mentorship.description && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 12 }}>About This Mentorship</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{mentorship.description}</p>
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
                  {formatCurrency(mentorship.sessionPrice)} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>per session</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {mentorship.status === 'Active' ? 'Currently accepting students' : `Status: ${mentorship.status}`}
                </p>
              </div>

              {isAuthenticated && isBuyer ? (
                hasApplied ? (
                  <Button variant="outline" disabled>Already Applied</Button>
                ) : (
                  <Button icon={FiSend} onClick={() => setShowApplyModal(true)} disabled={mentorship.status !== 'Active'}>
                    Apply for Mentorship
                  </Button>
                )
              ) : !isAuthenticated ? (
                <Button onClick={() => navigate('/login')}>Sign In to Apply</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for Mentorship">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Send a message to <strong>{mentorship.artisanName}</strong> explaining why you'd like to learn from them.
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell the mentor about yourself, your experience level, and what you hope to learn..."
            rows={5}
            style={{
              width: '100%', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)',
              background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical',
              fontFamily: 'var(--font-body)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <Button variant="ghost" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={applying} icon={FiSend}>Submit Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
