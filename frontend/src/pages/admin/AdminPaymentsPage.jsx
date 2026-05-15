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
  FiLock, FiUnlock,
} from 'react-icons/fi';
import './AdminTable.css';
import './AdminPaymentsPage.css';

/* ── Constants ───────────────────────────────────────── */
const FEE_RATE = 0.10;

/* ── Business logic helpers ──────────────────────────── */
function enrich(p, orderMap, requestMap) {
  const oid = p.order_id;
  const rid = p.request_id;
  const order   = oid ? orderMap[oid]   : null;
  const request = rid ? requestMap[rid] : null;

  const type      = p.paymentType || (rid ? 'escrow' : 'product');
  const amount    = Number(p.totalAmount || 0);
  const fee       = parseFloat((amount * FEE_RATE).toFixed(2));
  const payout    = parseFloat((amount - fee).toFixed(2));
  const isEscrow  = type === 'escrow';

  // Use real DB escrow fields
  const escrowHeld     = Number(p.escrowHeld || 0);
  const escrowReleased = Number(p.escrowReleased || 0);
  const escrowSt       = p.escrowStatus || 'none';

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
    releasedAmount:  escrowReleased,
    heldAmount:      escrowHeld,
    escrowStatus:    escrowSt,
    order,
    request,
  };
}

/* ── Search + filter ─────────────────────────────────── */
function applyFilters(rows, { query, type, status, method, escrow }) {
  return rows.filter(p => {
    if (type   && type   !== 'all' && p.paymentType !== type)           return false;
    if (status && status !== 'all' && (p.status||'').toLowerCase() !== status) return false;
    if (method && method !== 'all' && (p.paymentMethod||'').toLowerCase() !== method) return false;
    if (escrow && escrow !== 'all' && p.escrowStatus !== escrow) return false;
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
  escrow:  { label: 'Escrow Payment',   icon: FiLock,        cls: 'type-custom'  },
  custom:  { label: 'Custom Request',   icon: FiFileText,    cls: 'type-custom'  },
};
const STATUS_CONF = {
  completed: { label: 'Completed', cls: 'badge-green'  },
  pending:   { label: 'Pending',   cls: 'badge-yellow' },
  failed:    { label: 'Failed',    cls: 'badge-red'    },
};
const ESCROW_CONF = {
  pending:            { label: 'Awaiting Payment',   cls: 'badge-yellow' },
  held:               { label: 'Escrow Held',        cls: 'badge-blue'   },
  partially_released: { label: 'Partially Released', cls: 'badge-purple' },
  fully_released:     { label: 'Fully Released',     cls: 'badge-green'  },
  refunded:           { label: 'Refunded',           cls: 'badge-red'    },
  none:               { label: '—',                  cls: 'badge-neutral'},
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
  const c = ESCROW_CONF[status] || ESCROW_CONF.none;
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

  // Real escrow values from DB
  const escrowHeld     = payments.filter(p => p.paymentType === 'escrow').reduce((s, p) => s + p.heldAmount, 0);
  const escrowReleased = payments.filter(p => p.paymentType === 'escrow').reduce((s, p) => s + p.releasedAmount, 0);
  const fees           = payments.reduce((s, p) => s + p.platformFee, 0);
  const payouts        = payments.reduce((s, p) => s + p.artisanEarnings, 0);

  const cards = [
    { icon: FiDollarSign,  label: 'Total Revenue',      value: formatCurrency(total),          color: '#D4A843' },
    { icon: FiTrendingUp,  label: 'Monthly Revenue',    value: formatCurrency(monthly),        color: '#8B5CF6' },
    { icon: FiLock,        label: 'Escrow Held',        value: formatCurrency(escrowHeld),     color: '#3B82F6' },
    { icon: FiUnlock,      label: 'Escrow Released',    value: formatCurrency(escrowReleased), color: '#10B981' },
    { icon: FiPercent,     label: 'Platform Fees',      value: formatCurrency(fees),           color: '#F59E0B' },
    { icon: FiDollarSign,  label: 'Artisan Payouts',    value: formatCurrency(payouts),        color: '#A78BFA' },
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
function FilterSelect({ value, onChange, options, placeholder }) {
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
              {p.paymentType === 'escrow' && (
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

          {/* Escrow section (escrow payments only) */}
          {p.paymentType === 'escrow' && (
            <section className="pmt-modal-section">
              <h4 className="pmt-modal-section-title">Escrow Details</h4>
              <div className="pmt-modal-finance">
                <div className="pmt-finance-row">
                  <span>Total Escrow Amount</span>
                  <span className="pmt-finance-amount">{formatCurrency(p.escrowAmount)}</span>
                </div>
                <div className="pmt-finance-row">
                  <span>Currently Held</span>
                  <span className="pmt-finance-fee">{formatCurrency(p.heldAmount)}</span>
                </div>
                <div className="pmt-finance-row">
                  <span>Released to Artisan</span>
                  <span className="pmt-finance-payout">{formatCurrency(p.releasedAmount)}</span>
                </div>
              </div>
              {/* Progress bar */}
              {p.escrowAmount > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    <span>Release Progress</span>
                    <span>{Math.round((p.releasedAmount / p.escrowAmount) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-tertiary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3B82F6, #10B981)', width: `${Math.min(100, (p.releasedAmount / p.escrowAmount) * 100)}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              <p className="pmt-modal-note">
                ℹ Escrow funds are released milestone-by-milestone as the artisan completes project phases.
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
                <span className="pmt-modal-field-value">
                  {p.artisan_id ? `Artisan #${p.artisan_id}` : '—'}
                </span>
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
  const [fEscrow, setFEscrow] = useState('all');

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
    () => applyFilters(payments, { query, type: fType, status: fStat, method: fMeth, escrow: fEscrow }),
    [payments, query, fType, fStat, fMeth, fEscrow]
  );

  const isReady = !loading && lookupReady;

  const methods = useMemo(() => {
    const set = new Set(payments.map(p => p.paymentMethod).filter(Boolean));
    return [...set].map(m => ({ value: m.toLowerCase(), label: m }));
  }, [payments]);

  const hasFilters = query || fType !== 'all' || fStat !== 'all' || fMeth !== 'all' || fEscrow !== 'all';

  function clearFilters() {
    setQuery(''); setFType('all'); setFStat('all'); setFMeth('all'); setFEscrow('all');
  }

  // Summary counts
  const escrowCount = payments.filter(p => p.paymentType === 'escrow').length;
  const heldCount = payments.filter(p => p.escrowStatus === 'held').length;
  const releasedCount = payments.filter(p => p.escrowStatus === 'fully_released' || p.escrowStatus === 'partially_released').length;

  return (
    <div className="admin-table-page pmt-page">
      {/* ── Header ── */}
      <div className="admin-table-header pmt-header">
        <div>
          <h1>Payments</h1>
          <p className="admin-table-count">
            {isReady
              ? `${filtered.length} of ${payments.length} transactions · ${escrowCount} escrow · ${heldCount} held · ${releasedCount} released`
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
          <FilterSelect
            value={fType} onChange={setFType} placeholder="All Types"
            options={[
              { value: 'product', label: '🛍 Product Purchase' },
              { value: 'escrow',  label: '🔐 Escrow Payment'   },
            ]}
          />
          <FilterSelect
            value={fStat} onChange={setFStat} placeholder="All Statuses"
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'pending',   label: 'Pending'   },
              { value: 'failed',    label: 'Failed'    },
            ]}
          />
          <FilterSelect
            value={fMeth} onChange={setFMeth} placeholder="All Methods"
            options={methods}
          />
          <FilterSelect
            value={fEscrow} onChange={setFEscrow} placeholder="All Escrow"
            options={[
              { value: 'pending',            label: '⏳ Awaiting Payment' },
              { value: 'held',               label: '🔒 Held' },
              { value: 'partially_released', label: '🔓 Partially Released' },
              { value: 'fully_released',     label: '✅ Fully Released' },
              { value: 'refunded',           label: '↩️ Refunded' },
            ]}
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
                <th>Held / Released</th>
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

                  <td>
                    {p.paymentType === 'escrow' ? (
                      <div className="admin-cell-stack">
                        <span className="admin-cell-stack-primary" style={{ color: '#3B82F6', fontSize: 12 }}>
                          H: {formatCurrency(p.heldAmount)}
                        </span>
                        <span className="admin-cell-stack-secondary" style={{ color: '#10B981', fontSize: 11 }}>
                          R: {formatCurrency(p.releasedAmount)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                    )}
                  </td>

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
