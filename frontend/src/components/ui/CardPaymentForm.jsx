import { useState } from 'react';
import { FiCreditCard, FiUser, FiCalendar, FiLock, FiCheck } from 'react-icons/fi';
import './Input.css';

// Luhn algorithm for card number validation
function luhnCheck(num) {
  const digits = num.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Detect card type
function getCardType(number) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  return 'unknown';
}

const CARD_COLORS = {
  visa: 'linear-gradient(135deg, #1a1f71, #2563eb)',
  mastercard: 'linear-gradient(135deg, #eb001b, #f79e1b)',
  amex: 'linear-gradient(135deg, #006fcf, #00cfff)',
  discover: 'linear-gradient(135deg, #ff6000, #ffb347)',
  unknown: 'linear-gradient(135deg, #374151, #6b7280)',
};

export default function CardPaymentForm({ onSubmit, loading = false, amount = 0 }) {
  const [form, setForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const cardType = getCardType(form.cardNumber);

  const handleChange = (field, value) => {
    let formatted = value;

    if (field === 'cardNumber') {
      // Remove non-digits, add spaces every 4
      const digits = value.replace(/\D/g, '').slice(0, 16);
      formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    }

    if (field === 'expiryDate') {
      let digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 2) {
        formatted = digits.slice(0, 2) + '/' + digits.slice(2);
      } else {
        formatted = digits;
      }
    }

    if (field === 'cvv') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
    }

    if (field === 'cardholderName') {
      formatted = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    setForm(prev => ({ ...prev, [field]: formatted }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const errs = {};

    if (!form.cardholderName.trim()) {
      errs.cardholderName = 'Cardholder name is required';
    } else if (form.cardholderName.trim().length < 3) {
      errs.cardholderName = 'Name must be at least 3 characters';
    }

    const cleanNumber = form.cardNumber.replace(/\s/g, '');
    if (!cleanNumber) {
      errs.cardNumber = 'Card number is required';
    } else if (cleanNumber.length < 13) {
      errs.cardNumber = 'Card number is too short';
    } else if (!luhnCheck(cleanNumber)) {
      errs.cardNumber = 'Invalid card number';
    }

    if (!form.expiryDate) {
      errs.expiryDate = 'Expiry date is required';
    } else {
      const parts = form.expiryDate.split('/');
      if (parts.length !== 2) {
        errs.expiryDate = 'Use MM/YY format';
      } else {
        const month = parseInt(parts[0], 10);
        const year = parseInt('20' + parts[1], 10);
        const now = new Date();
        if (month < 1 || month > 12) {
          errs.expiryDate = 'Invalid month';
        } else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
          errs.expiryDate = 'Card has expired';
        }
      }
    }

    if (!form.cvv) {
      errs.cvv = 'CVV is required';
    } else if (form.cvv.length < 3) {
      errs.cvv = 'CVV must be 3-4 digits';
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ cardholderName: true, cardNumber: true, expiryDate: true, cvv: true });

    if (Object.keys(errs).length === 0) {
      // Don't send actual card data — just confirm payment
      onSubmit({ paymentMethod: 'Card' });
    }
  };

  const maskedNumber = form.cardNumber || '•••• •••• •••• ••••';

  return (
    <div style={{ width: '100%' }}>
      {/* Card Preview */}
      <div
        style={{
          background: CARD_COLORS[cardType],
          borderRadius: 16,
          padding: '24px 28px',
          color: '#fff',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transition: 'background 0.5s ease',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FiCreditCard size={28} />
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>
            {cardType !== 'unknown' ? cardType : 'Credit Card'}
          </span>
        </div>

        <div>
          <p style={{ fontSize: 20, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>
            {maskedNumber}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', marginBottom: 2 }}>Card Holder</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{form.cardholderName || 'YOUR NAME'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', marginBottom: 2 }}>Expires</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{form.expiryDate || 'MM/YY'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Cardholder Name */}
        <div className={`input-group input-full ${errors.cardholderName && touched.cardholderName ? 'input-error' : ''}`}>
          <label className="input-label">Cardholder Name</label>
          <div className="input-wrapper">
            <span className="input-icon"><FiUser /></span>
            <input
              className="input-field input-with-icon"
              type="text"
              placeholder="Name on card"
              value={form.cardholderName}
              onChange={e => handleChange('cardholderName', e.target.value)}
              onBlur={() => handleBlur('cardholderName')}
              autoComplete="cc-name"
            />
          </div>
          {errors.cardholderName && touched.cardholderName && <span className="input-error-msg">{errors.cardholderName}</span>}
        </div>

        {/* Card Number */}
        <div className={`input-group input-full ${errors.cardNumber && touched.cardNumber ? 'input-error' : ''}`}>
          <label className="input-label">Card Number</label>
          <div className="input-wrapper">
            <span className="input-icon"><FiCreditCard /></span>
            <input
              className="input-field input-with-icon"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={form.cardNumber}
              onChange={e => handleChange('cardNumber', e.target.value)}
              onBlur={() => handleBlur('cardNumber')}
              autoComplete="cc-number"
              inputMode="numeric"
            />
            {form.cardNumber && !errors.cardNumber && luhnCheck(form.cardNumber.replace(/\s/g, '')) && (
              <span style={{ position: 'absolute', right: 12, color: 'var(--success)', display: 'flex' }}>
                <FiCheck size={16} />
              </span>
            )}
          </div>
          {errors.cardNumber && touched.cardNumber && <span className="input-error-msg">{errors.cardNumber}</span>}
        </div>

        {/* Expiry + CVV row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className={`input-group input-full ${errors.expiryDate && touched.expiryDate ? 'input-error' : ''}`}>
            <label className="input-label">Expiry Date</label>
            <div className="input-wrapper">
              <span className="input-icon"><FiCalendar /></span>
              <input
                className="input-field input-with-icon"
                type="text"
                placeholder="MM/YY"
                value={form.expiryDate}
                onChange={e => handleChange('expiryDate', e.target.value)}
                onBlur={() => handleBlur('expiryDate')}
                autoComplete="cc-exp"
                inputMode="numeric"
              />
            </div>
            {errors.expiryDate && touched.expiryDate && <span className="input-error-msg">{errors.expiryDate}</span>}
          </div>

          <div className={`input-group input-full ${errors.cvv && touched.cvv ? 'input-error' : ''}`}>
            <label className="input-label">CVV</label>
            <div className="input-wrapper">
              <span className="input-icon"><FiLock /></span>
              <input
                className="input-field input-with-icon"
                type="password"
                placeholder="•••"
                value={form.cvv}
                onChange={e => handleChange('cvv', e.target.value)}
                onBlur={() => handleBlur('cvv')}
                autoComplete="cc-csc"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
            {errors.cvv && touched.cvv && <span className="input-error-msg">{errors.cvv}</span>}
          </div>
        </div>

        {/* Security note */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', margin: '16px 0 20px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success)', fontSize: 12,
        }}>
          <FiLock size={13} />
          <span>Your card details are encrypted and secure. We do not store card information.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing Payment...' : `Pay ${amount ? `$${Number(amount).toFixed(2)}` : ''}`}
        </button>
      </form>
    </div>
  );
}
