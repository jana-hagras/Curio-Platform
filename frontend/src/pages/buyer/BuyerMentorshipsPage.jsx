import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { mentorshipApplicationService } from '../../services/mentorshipApplicationService';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiBookOpen, FiClock, FiLink, FiDollarSign, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['Cash', 'Visa', 'MasterCard', 'PayPal'];

export default function BuyerMentorshipsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingApp, setPayingApp] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Visa');
  const [paying, setPaying] = useState(false);

  const loadData = () => {
    mentorshipApplicationService.getByBuyer(user.id)
      .then(res => setApplications(res.data?.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user.id]);

  const handlePay = async () => {
    if (!payingApp) return;
    setPaying(true);
    try {
      await paymentService.create({
        mentorship_id: payingApp.mentorship_id,
        artisan_id: payingApp.artisan_id,
        totalAmount: payingApp.mentorshipPrice,
        paymentMethod,
        status: 'Completed',
        paymentType: 'mentorship',
      });
      toast.success('Payment completed!');
      setShowPayModal(false);
      setPayingApp(null);
      // Mark application as completed
      await mentorshipApplicationService.update(payingApp.id, { status: 'Completed' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  if (loading) return <DashboardSkeleton />;

  const pending = applications.filter(a => a.status === 'Pending');
  const accepted = applications.filter(a => a.status === 'Accepted');
  const completed = applications.filter(a => a.status === 'Completed');

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Mentorships</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Track your mentorship applications and sessions</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Pending', value: pending.length, icon: FiClock, color: '#F59E0B' },
          { label: 'Accepted', value: accepted.length, icon: FiCheckCircle, color: '#10B981' },
          { label: 'Completed', value: completed.length, icon: FiBookOpen, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><s.icon /></div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.label}</p>
              <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}><FiBookOpen /></div>
          <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', marginBottom: 8 }}>No Mentorship Applications</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Browse available mentorships and apply to learn from artisans</p>
          <Button onClick={() => navigate('/mentorships')}>Browse Mentorships</Button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 600 }}>Applications ({applications.length})</h3>
          </div>
          {applications.map((app, i) => (
            <div key={app.id} style={{
              padding: '20px 24px',
              borderBottom: i < applications.length - 1 ? '1px solid var(--surface-border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
              transition: 'background 0.15s',
            }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
               onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,168,67,0.1)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}><FiBookOpen /></div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                    {app.mentorshipCategory || 'General'} Mentorship
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    with {app.artisanName || 'Artisan'} · {formatCurrency(app.mentorshipPrice)}/session · {app.mentorshipDuration}min
                  </p>
                  {app.applicationDate && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Applied {formatDate(app.applicationDate)}</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge status={app.status}>{app.status}</Badge>
                {app.status === 'Accepted' && (
                  <>
                    {app.meetingLink && (
                      <a href={app.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--gold-primary)', fontWeight: 600, padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(212,168,67,0.1)' }}>
                        <FiExternalLink size={13} /> Join Session
                      </a>
                    )}
                    <Button size="sm" icon={FiDollarSign} onClick={() => { setPayingApp(app); setShowPayModal(true); }}>
                      Pay {formatCurrency(app.mentorshipPrice)}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Complete Payment">
        {payingApp && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ background: 'var(--surface-secondary)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{payingApp.mentorshipCategory || 'General'} Mentorship</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>with {payingApp.artisanName}</p>
              <p style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: 22, marginTop: 12 }}>{formatCurrency(payingApp.mentorshipPrice)}</p>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 20 }}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="ghost" onClick={() => setShowPayModal(false)}>Cancel</Button>
              <Button onClick={handlePay} loading={paying} icon={FiDollarSign}>Confirm Payment</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
