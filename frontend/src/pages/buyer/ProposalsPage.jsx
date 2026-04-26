import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import { milestoneService } from '../../services/milestoneService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiCheck, FiX, FiInbox } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProposalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [proposals, setProposals] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedReq, setExpandedReq] = useState(null);
  const [milestones, setMilestones] = useState({});

  useEffect(() => {
    requestService.getByBuyer(user.id)
      .then(async (res) => {
        const reqs = res.data?.requests || [];
        setRequests(reqs);
        const propMap = {};
        await Promise.all(reqs.map(async (r) => {
          try {
            const aRes = await applicationService.getByRequest(r.id);
            propMap[r.id] = aRes.data?.applications || [];
          } catch { propMap[r.id] = []; }
        }));
        setProposals(propMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleAccept = async (requestId, appId) => {
    try {
      await applicationService.update(appId, { status: 'Approved' });
      // Reject others
      const others = (proposals[requestId] || []).filter(a => a.id !== appId);
      await Promise.all(others.map(a => applicationService.update(a.id, { status: 'Rejected' }).catch(() => {})));
      // Generate milestones
      const milestoneTitles = ['Project Kickoff', 'Design Phase', 'Production', 'Quality Review', 'Delivery'];
      const now = new Date();
      const created = [];
      for (let i = 0; i < milestoneTitles.length; i++) {
        const due = new Date(now);
        due.setDate(due.getDate() + (i + 1) * 7);
        try {
          const mRes = await milestoneService.create({
            request_id: requestId,
            title: milestoneTitles[i],
            description: `${milestoneTitles[i]} phase`,
            dueDate: due.toISOString().slice(0, 19).replace('T', ' '),
            status: 'Pending',
          });
          created.push(mRes.data?.milestone || { id: Date.now() + i, title: milestoneTitles[i], status: 'Pending', dueDate: due.toISOString() });
        } catch {}
      }
      setMilestones(prev => ({ ...prev, [requestId]: created }));

      // Update local state
      setProposals(prev => ({
        ...prev,
        [requestId]: prev[requestId].map(a =>
          a.id === appId ? { ...a, status: 'Approved' } : { ...a, status: 'Rejected' }
        ),
      }));
      toast.success('Proposal accepted! Milestones generated.');
      setExpandedReq(requestId);
    } catch (err) {
      toast.error('Failed to accept proposal');
    }
  };

  const loadMilestones = async (requestId) => {
    try {
      const mRes = await milestoneService.getByRequest(requestId);
      setMilestones(prev => ({ ...prev, [requestId]: mRes.data?.milestones || [] }));
    } catch {}
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Proposals</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>View and manage proposals from artisans</p>
      </div>

      {requests.length === 0 ? (
        <div style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', padding: '80px 32px', textAlign: 'center' }}>
          <FiInbox style={{ fontSize: 56, color: 'var(--surface-border)', marginBottom: 20 }} />
          <h3 style={{ fontSize: 22, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 8 }}>No proposals yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Create a request to start receiving proposals from artisans</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {requests.map(req => {
            const apps = proposals[req.id] || [];
            const reqMilestones = milestones[req.id] || [];
            const hasApproved = apps.some(a => a.status === 'Approved');
            const isExpanded = expandedReq === req.id;

            return (
              <div key={req.id} style={{ background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                <div onClick={() => { setExpandedReq(isExpanded ? null : req.id); if (!isExpanded && !reqMilestones.length) loadMilestones(req.id); }}
                  style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid var(--surface-border)' : 'none' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 4 }}>{req.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{req.category} · Budget: {formatCurrency(req.budget)} · {apps.length} proposal(s)</p>
                  </div>
                  <Badge status={hasApproved ? 'Approved' : 'Pending'}>{hasApproved ? 'Accepted' : `${apps.length} Proposals`}</Badge>
                </div>
                {isExpanded && (
                  <div style={{ padding: '16px 24px' }}>
                    {apps.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '16px 0' }}>No proposals yet for this request.</p>
                    ) : (
                      apps.map(app => (
                        <div key={app.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <p style={{ fontWeight: 600, fontSize: 15 }}>{app.artisanName || `Artisan #${app.artisan_id}`}</p>
                              <Badge status={app.status} />
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{app.proposal}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(app.applicationDate)}</p>
                          </div>
                          {app.status === 'Pending' && !hasApproved && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button size="sm" onClick={() => handleAccept(req.id, app.id)} icon={FiCheck}>Accept</Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {/* Milestones */}
                    {reqMilestones.length > 0 && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
                        <h4 style={{ fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16 }}>Milestones</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {reqMilestones.map((m, i) => (
                            <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.status === 'Completed' ? 'var(--success)' : 'var(--surface-tertiary)', color: m.status === 'Completed' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                {m.status === 'Completed' ? <FiCheck /> : i + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Due: {formatDate(m.dueDate)}</p>
                              </div>
                              <Badge status={m.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
