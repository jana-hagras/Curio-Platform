import { useState, useEffect, useMemo } from 'react';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { requestService } from '../../services/requestService';
import { useAdminData } from './useAdminData';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import {
  FiSearch, FiX, FiDollarSign, FiTrendingUp,
  FiShield, FiPercent, FiShoppingBag,
  FiFileText, FiChevronDown, FiEye, FiRefreshCw,
} from 'react-icons/fi';
import './AdminTable.css';
import './AdminPaymentsPage.css';

/* ── Constants ───────────────────────────────────────── */
const FEE_RATE = 0.10;
const THIS_MONTH = new Date().toISOString().slice(0, 7); // "YYYY-MM"

/* ── Business logic helpers ──────────────────────────── */
function paymentType(p) {
  return p.request_id ? 'custom' : 'product';
}

function escrowStatus(p) {
  if (!p.request_id) return 'na';
  const s = (p.status || '').toLowerCase();
  if (s === 'pending')   return 'escrow_pending';
  if (s === 'completed') return 'escrow_held';
  if (s === 'failed')    return 'refunded';
  return 'na';
}

function enrich(p, orderMap, requestMap) {
  const oid = p.order_id;
  const rid = p.request_id;
  const order   = oid ? orderMap[oid]   : null;
  const request = rid ? requestMap[rid] : null;

  const type      = paymentType(p);
  const amount    = Number(p.totalAmount || 0);
  const fee       = parseFloat((amount * FEE_RATE).toFixed(2));
  const payout    = parseFloat((amount - fee).toFixed(2));
  const isEscrow  = type === 'custom';
  const escrow    = escrowStatus(p);

  return {
    ...p,
    paymentType:     type,
    buyerName:       order?.buyerName || request?.buyerName || '—',
    buyerId:         order?.buyer_id  ?? request?.buyer_id  ?? null,
    referenceName:   request?.title   || (order ? `Order #${oid}` : '—'),
    referenceLabel:  order ? `Order #${oid}` : (request ? `Request #${rid}` : '—'),
    amount,
    platformFee:     fee,
    artisanEarnings: payout,
    escrowAmount:    isEscrow ? amount : 0,
    releasedAmount:  0,
    heldAmount:      isEscrow ? amount : 0,
    escrowStatus:    escrow,
    milestoneStatus: isEscrow ? 'Pending' : 'N/A',
    order,
    request,
  };
}

/* ── Search + filter ─────────────────────────────────── */
function applyFilters(rows, { query, type, status, method }) {
  return rows.filter(p => {
    if (type   && type   !== 'all' && p.paymentType !== type)           return false;
    if (status && status !== 'all' && (p.status||'').toLowerCase() !== status) return false;
    if (method && method !== 'all' && (p.paymentMethod||'').toLowerCase() !== method) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [
      p.id, p.buyerName, p.referenceName, p.referenceLabel,
      p.paymentMethod, p.status, p.escrowStatus, p.paymentType,
      p.amount, p.transactionDate,
    ].some(v => String(v ?? '').toLowerCase().includes(q));
  });
}

/* ── Sub-components ──────────────────────────────────── */
const TYPE_CONF = {
  product: { label: 'Product Purchase', icon: FiShoppingBag, cls: 'type-product' },
  custom:  { label: 'Custom Request',   icon: FiFileText,    cls: 'type-custom'  },
};
const STATUS_CONF = {
  completed: { label: 'Completed', cls: 'badge-green'  },
  pending:   { label: 'Pending',   cls: 'badge-yellow' },
  failed:    { label: 'Failed',    cls: 'badge-red'    },
};
const ESCROW_CONF = {
  escrow_pending:     { label: 'Escrow Pending',     cls: 'badge-yellow' },
  escrow_held:        { label: 'Escrow Held',        cls: 'badge-blue'   },
  partially_released: { label: 'Partially Released', cls: 'badge-purple' },
  fully_released:     { label: 'Fully Released',     cls: 'badge-green'  },
  refunded:           { label: 'Refunded',           cls: 'badge-red'    },
  disputed:           { label: 'Disputed',           cls: 'badge-red'    },
  na:                 { label: '—',                  cls: 'badge-neutral'},
};

function TypeBadge({ type }) {
  const c = TYPE_CONF[type] || TYPE_CONF.product;
  const Icon = c.icon;
  return (
    <span className={`pmt-type-badge ${c.cls}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}
function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const c   = STATUS_CONF[key] || { label: status || '—', cls: 'badge-neutral' };
  return <span className={`admin-badge ${c.cls}`}>{c.label}</span>;
}
function EscrowBadge({ status }) {
  const c = ESCROW_CONF[status] || ESCROW_CONF.na;
  return <span className={`admin-badge ${c.cls}`}>{c.label}</span>;
}

/* ── Analytics cards ─────────────────────────────────── */
function AnalyticsCards({ payments }) {
  const now       = new Date().getMonth();
  const nowYear   = new Date().getFullYear();

  const total     = payments.reduce((s, p) => s + p.amount, 0);
  const monthly   = payments
    .filter(p => {
      const d = new Date(p.transactionDate || '');
      return d.getMonth() === now && d.getFullYear() === nowYear;
    })
    .reduce((s, p) => s + p.amount, 0);
  const escrow    = payments.filter(p => p.paymentType === 'custom').reduce((s, p) => s + p.heldAmount, 0);
  const fees      = payments.reduce((s, p) => s + p.platformFee, 0);
  const payouts   = payments.reduce((s, p) => s + p.artisanEarnings, 0);

  const cards = [
    { icon: FiDollarSign,  label: 'Total Revenue',   value: formatCurrency(total),   color: '#D4A843' },
    { icon: FiTrendingUp,  label: 'Monthly Revenue', value: formatCurrency(monthly), color: '#8B5CF6' },
    { icon: FiShield,      label: 'Active Escrow',   value: formatCurrency(escrow),  color: '#3B82F6' },
    { icon: FiPercent,     label: 'Platform Fees',   value: formatCurrency(fees),    color: '#10B981' },
    { icon: FiDollarSign,  label: 'Artisan Payouts', value: formatCurrency(payouts), color: '#A78BFA' },
  ];

  return (
    <div className="pmt-analytics-grid">
      {cards.map(c => (
        <div key={c.label} className="pmt-analytics-card">
          <div className="pmt-analytics-icon" style={{ background: `${c.color}18`, color: c.color }}>
            <c.icon size={16} />
          </div>
          <div className="pmt-analytics-body">
            <span className="pmt-analytics-label">{c.label}</span>
            <span className="pmt-analytics-value" style={{ color: c.color }}>{c.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Filter bar ──────────────────────────────────────── */
function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="pmt-select-wrap">
      <select value={value} onChange={e => onChange(e.target.value)} className="pmt-select">
        <option value="all">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FiChevronDown className="pmt-select-icon" size={13} />
    </div>
  );
}

/* ── Payment detail modal ────────────────────────────── */
function PaymentModal({ payment: p, onClose }) {
  if (!p) return null;
  return (
    <div className="pmt-modal-backdrop" onClick={onClose}>
      <div className="pmt-modal" onClick={e => e.stopPropagation()}>
        <div className="pmt-modal-header">
          <div>
            <h2 className="pmt-modal-title">Payment #{p.id}</h2>
            <TypeBadge type={p.paymentType} />
          </div>
          <button className="pmt-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="pmt-modal-body">
          {/* Transaction details */}
          <section className="pmt-modal-section">
            <h4 className="pmt-modal-section-title">Transaction Details</h4>
            <div className="pmt-modal-grid">
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Reference</span>
                <span className="pmt-modal-field-value">{p.referenceLabel}</span>
              </div>
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Product / Request</span>
                <span className="pmt-modal-field-value">{p.referenceName}</span>
              </div>
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Method</span>
                <span className="pmt-modal-field-value">{p.paymentMethod || '—'}</span>
              </div>
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Date</span>
                <span className="pmt-modal-field-value">
                  {p.transactionDate ? new Date(p.transactionDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                </span>
              </div>
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Status</span>
                <StatusBadge status={p.status} />
              </div>
              {p.paymentType === 'custom' && (
                <div className="pmt-modal-field">
                  <span className="pmt-modal-field-label">Escrow Status</span>
                  <EscrowBadge status={p.escrowStatus} />
                </div>
              )}
            </div>
          </section>

          {/* Financial breakdown */}
          <section className="pmt-modal-section">
            <h4 className="pmt-modal-section-title">Financial Breakdown</h4>
            <div className="pmt-modal-finance">
              <div className="pmt-finance-row">
                <span>Total Amount</span>
                <span className="pmt-finance-amount">{formatCurrency(p.amount)}</span>
              </div>
              <div className="pmt-finance-row fee">
                <span>Platform Fee (10%)</span>
                <span className="pmt-finance-fee">−{formatCurrency(p.platformFee)}</span>
              </div>
              <div className="pmt-finance-row total">
                <span>Artisan Payout</span>
                <span className="pmt-finance-payout">{formatCurrency(p.artisanEarnings)}</span>
              </div>
            </div>
          </section>

          {/* Escrow section (custom requests only) */}
          {p.paymentType === 'custom' && (
            <section className="pmt-modal-section">
              <h4 className="pmt-modal-section-title">Escrow Details</h4>
              <div className="pmt-modal-finance">
                <div className="pmt-finance-row">
                  <span>Total Escrow Held</span>
                  <span className="pmt-finance-amount">{formatCurrency(p.escrowAmount)}</span>
                </div>
                <div className="pmt-finance-row">
                  <span>Released to Artisan</span>
                  <span className="pmt-finance-payout">{formatCurrency(p.releasedAmount)}</span>
                </div>
                <div className="pmt-finance-row">
                  <span>Remaining in Escrow</span>
                  <span className="pmt-finance-fee">{formatCurrency(p.heldAmount)}</span>
                </div>
              </div>
              <p className="pmt-modal-note">
                ℹ Escrow funds are released milestone-by-milestone upon buyer confirmation.
              </p>
            </section>
          )}

          {/* Parties */}
          <section className="pmt-modal-section">
            <h4 className="pmt-modal-section-title">Parties</h4>
            <div className="pmt-modal-grid">
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Buyer</span>
                <span className="pmt-modal-field-value">
                  {p.buyerName}
                  {p.buyerId && <span className="pmt-modal-field-sub"> · ID #{p.buyerId}</span>}
                </span>
              </div>
              <div className="pmt-modal-field">
                <span className="pmt-modal-field-label">Artisan</span>
                <span className="pmt-modal-field-value">{p.artisanName || '—'}</span>
              </div>
            </div>
          </section>

          {/* Related entity */}
          {(p.order || p.request) && (
            <section className="pmt-modal-section">
              <h4 className="pmt-modal-section-title">
                {p.order ? 'Related Order' : 'Related Request'}
              </h4>
              {p.order && (
                <div className="pmt-modal-grid">
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Order Date</span>
                    <span className="pmt-modal-field-value">
                      {p.order.orderDate ? new Date(p.order.orderDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Delivery Address</span>
                    <span className="pmt-modal-field-value">{p.order.deliveryAddress || '—'}</span>
                  </div>
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Order Status</span>
                    <StatusBadge status={p.order.status} />
                  </div>
                </div>
              )}
              {p.request && (
                <div className="pmt-modal-grid">
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Title</span>
                    <span className="pmt-modal-field-value">{p.request.title}</span>
                  </div>
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Category</span>
                    <span className="pmt-modal-field-value">{p.request.category || '—'}</span>
                  </div>
                  <div className="pmt-modal-field">
                    <span className="pmt-modal-field-label">Budget</span>
                    <span className="pmt-modal-field-value">{formatCurrency(p.request.budget)}</span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="admin-loading-skeleton">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="admin-skeleton-row">
          {[40, 120, 100, 100, 80, 70, 80, 80, 90].map((w, j) => (
            <div key={j} className="admin-skeleton-cell" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function AdminPaymentsPage() {
  const [raw, setRaw]         = useState([]);
  const [orders, setOrders]   = useState([]);
  const [reqs, setReqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Filters
  const [query,  setQuery]  = useState('');
  const [fType,  setFType]  = useState('all');
  const [fStat,  setFStat]  = useState('all');
  const [fMeth,  setFMeth]  = useState('all');

  const { loaded: lookupReady } = useAdminData();

  /* Load data */
  useEffect(() => {
    (async () => {
      try {
        const [pRes, oRes, rRes] = await Promise.all([
          paymentService.getAll(),
          orderService.getAll(),
          requestService.getAll(),
        ]);
        setRaw(pRes.data?.payments || []);
        setOrders(oRes.data?.orders   || []);
        setReqs(rRes.data?.requests   || []);
      } catch (e) {
        toast.error('Failed to load payments data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Build lookup maps */
  const orderMap   = useMemo(() => Object.fromEntries(orders.map(o => [o.id, o])), [orders]);
  const requestMap = useMemo(() => Object.fromEntries(reqs.map(r => [r.id, r])), [reqs]);

  /* Enrich payments */
  const payments = useMemo(
    () => raw.map(p => enrich(p, orderMap, requestMap)),
    [raw, orderMap, requestMap]
  );

  /* Filter */
  const filtered = useMemo(
    () => applyFilters(payments, { query, type: fType, status: fStat, method: fMeth }),
    [payments, query, fType, fStat, fMeth]
  );

  const isReady = !loading && lookupReady;

  const methods = useMemo(() => {
    const set = new Set(payments.map(p => p.paymentMethod).filter(Boolean));
    return [...set].map(m => ({ value: m.toLowerCase(), label: m }));
  }, [payments]);

  const hasFilters = query || fType !== 'all' || fStat !== 'all' || fMeth !== 'all';

  function clearFilters() {
    setQuery(''); setFType('all'); setFStat('all'); setFMeth('all');
  }

  return (
    <div className="admin-table-page pmt-page">
      {/* ── Header ── */}
      <div className="admin-table-header pmt-header">
        <div>
          <h1>Payments</h1>
          <p className="admin-table-count">
            {isReady
              ? `${filtered.length} of ${payments.length} transactions · ${payments.filter(p => p.paymentType === 'custom').length} escrow payments`
              : 'Loading financial data…'}
          </p>
        </div>
        <div className="pmt-header-right">
          <div className="admin-search-bar">
            <FiSearch className="search-icon" size={14} />
            <input
              placeholder="Search buyer, amount, status…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="pmt-clear-search" onClick={() => setQuery('')}>
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Analytics ── */}
      {isReady && <AnalyticsCards payments={payments} />}

      {/* ── Filter Bar ── */}
      <div className="pmt-filter-bar">
        <div className="pmt-filter-left">
          <FiRefreshCw size={13} className="pmt-filter-icon" />
          <span className="pmt-filter-label">Filters:</span>
          <Select
            value={fType} onChange={setFType} placeholder="All Types"
            options={[
              { value: 'product', label: '🛍 Product Purchase' },
              { value: 'custom',  label: '🎨 Custom Request'   },
            ]}
          />
          <Select
            value={fStat} onChange={setFStat} placeholder="All Statuses"
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'pending',   label: 'Pending'   },
              { value: 'failed',    label: 'Failed'    },
            ]}
          />
          <Select
            value={fMeth} onChange={setFMeth} placeholder="All Methods"
            options={methods}
          />
        </div>
        {hasFilters && (
          <button className="pmt-clear-filters" onClick={clearFilters}>
            <FiX size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="admin-table-wrapper pmt-table-wrapper">
        {!isReady ? <Skeleton /> : filtered.length === 0 ? (
          <div className="admin-table-empty pmt-empty">
            <FiDollarSign size={40} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
            <p>{hasFilters ? 'No payments match your filters.' : 'No payment records yet.'}</p>
            {hasFilters && (
              <button className="pmt-clear-filters" style={{ marginTop: 12 }} onClick={clearFilters}>
                <FiX size={12} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table pmt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Platform Fee</th>
                <th>Artisan Payout</th>
                <th>Method</th>
                <th>Status</th>
                <th>Escrow</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="pmt-row" onClick={() => setSelected(p)}>
                  <td className="admin-cell-id pmt-cell-id">#{p.id}</td>

                  <td><TypeBadge type={p.paymentType} /></td>

                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary pmt-ref-name">{p.referenceName}</span>
                      <span className="admin-cell-stack-secondary">{p.referenceLabel}</span>
                    </div>
                  </td>

                  <td>
                    <div className="admin-cell-stack">
                      <span className="admin-cell-stack-primary">{p.buyerName}</span>
                      {p.buyerId && (
                        <span className="admin-cell-stack-secondary">ID #{p.buyerId}</span>
                      )}
                    </div>
                  </td>

                  <td className="admin-cell-primary pmt-amount">{formatCurrency(p.amount)}</td>

                  <td className="pmt-fee">
                    <span className="pmt-fee-pill">−{formatCurrency(p.platformFee)}</span>
                  </td>

                  <td className="pmt-payout">{formatCurrency(p.artisanEarnings)}</td>

                  <td className="admin-cell-secondary pmt-method">
                    {p.paymentMethod || '—'}
                  </td>

                  <td><StatusBadge status={p.status} /></td>

                  <td><EscrowBadge status={p.escrowStatus} /></td>

                  <td className="admin-cell-secondary">
                    {p.transactionDate
                      ? new Date(p.transactionDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
                      : '—'}
                  </td>

                  <td>
                    <button className="pmt-view-btn" title="View details" onClick={e => { e.stopPropagation(); setSelected(p); }}>
                      <FiEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {selected && <PaymentModal payment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
