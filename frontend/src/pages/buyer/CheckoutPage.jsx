import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { orderItemService } from '../../services/orderItemService';
import { paymentService } from '../../services/paymentService';
import { requestService } from '../../services/requestService';
import { PAYMENT_METHODS_MARKETPLACE } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import CardPaymentForm from '../../components/ui/CardPaymentForm';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiShield, FiCheck, FiFileText, FiLock, FiTruck, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import InvoiceModal from '../../components/ui/InvoiceModal';
import { useTranslation } from 'react-i18next';
import './Checkout.css';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation(['order', 'common', 'dashboard']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [step, setStep] = useState('form'); // form | success
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [form, setForm] = useState({
    shippingAddress: user?.address || '',
    paymentMethod: '',
  });

  const isRtl = i18n.language === 'ar';

  // Escrow checkout state
  const [escrowMode, setEscrowMode] = useState(false);
  const [escrowPayment, setEscrowPayment] = useState(null);
  const [escrowRequest, setEscrowRequest] = useState(null);

  // Country-based payment methods
  const buyerCountry = user?.country || '';
  const isEgypt = buyerCountry.toLowerCase() === 'egypt';
  const availableMethods = useMemo(() => {
    return isEgypt ? PAYMENT_METHODS_MARKETPLACE.egypt : PAYMENT_METHODS_MARKETPLACE.international;
  }, [isEgypt]);

  // Set default payment method
  useEffect(() => {
    if (availableMethods.length && !form.paymentMethod) {
      setForm(prev => ({ ...prev, paymentMethod: availableMethods[0] }));
    }
  }, [availableMethods]);

  // Detect escrow checkout via URL params: ?payment_id=X&request_id=Y
  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const requestId = searchParams.get('request_id');

    if (paymentId && requestId) {
      setEscrowMode(true);
      Promise.all([
        paymentService.getById(paymentId),
        requestService.getById(requestId),
      ])
        .then(([pRes, rRes]) => {
          setEscrowPayment(pRes.data?.payment || null);
          setEscrowRequest(rRes.data?.request || null);
        })
        .catch((err) => {
          console.error('Failed to load escrow data:', err);
          toast.error(t('order:checkoutExtra.paymentDataMissing', 'Payment data missing'));
          navigate('/dashboard/proposals');
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [searchParams, navigate, t]);

  // Redirect to cart if regular checkout with empty cart
  if (!initialLoading && !escrowMode && items.length === 0 && step !== 'success') {
    navigate('/cart');
    return null;
  }

  // ── Regular Cart Checkout ──
  const handleCartCheckout = async (e) => {
    e.preventDefault();
    if (!form.shippingAddress) { toast.error(t('order:checkoutExtra.addressRequired', 'Address is required')); return; }
    if (!form.paymentMethod) { toast.error(t('order:checkoutExtra.paymentMethodRequired', 'Payment method is required')); return; }

    setLoading(true);
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      // 1. Create order
      const orderRes = await orderService.create({
        buyer_id: user.id,
        orderDate: now,
        status: 'Pending',
        totalAmount: totalPrice,
        deliveryAddress: form.shippingAddress
      });
      
      const orderId = orderRes?.data?.order?.id || orderRes?.order?.id || orderRes?.data?.id || orderRes?.id;
      if (!orderId) throw new Error(t('order:checkoutExtra.failedCreateOrder', 'Failed to create order'));

      // 2. Create order items
      for (const item of items) {
        await orderItemService.create({
          order_id: orderId,
          item_id: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price
        });
      }

      // 3. Create payment (with buyer_id for commission tracking)
      await paymentService.create({
        order_id: orderId,
        buyer_id: user.id,
        totalAmount: totalPrice,
        paymentDate: now,
        paymentMethod: form.paymentMethod,
        status: 'Completed',
        paymentType: 'product'
      });

      // 4. Update order status
      await orderService.update(orderId, { status: 'Completed' }).catch(() => {});

      // Save order details for the invoice
      setPlacedOrder({
        id: orderId,
        orderDate: now,
        totalAmount: totalPrice,
        status: 'Completed',
        shippingAddress: form.shippingAddress,
        buyerName: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
        items: [...items]
      });

      clearCart();
      setStep('success');
      toast.success(t('order:checkoutExtra.orderConfirmed', 'Order Confirmed!'));
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err?.message || t('order:checkoutExtra.failedOrder', 'Failed to place order. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Escrow Payment Checkout ──
  const handleEscrowCheckout = async (e) => {
    e.preventDefault();
    if (!escrowPayment) { toast.error(t('order:checkoutExtra.paymentDataMissing', 'Payment data missing')); return; }

    setLoading(true);
    try {
      // Update the pending escrow payment to Completed with selected method
      await paymentService.update(escrowPayment.id, {
        status: 'Completed',
        paymentMethod: form.paymentMethod,
      });

      setStep('success');
      toast.success(t('order:checkoutExtra.escrowSuccess', 'Escrow payment confirmed! Funds are now held securely.'));
    } catch (err) {
      console.error('Escrow checkout error:', err);
      toast.error(err?.message || t('order:checkoutExtra.escrowFailed', 'Failed to process escrow payment. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Card payment handler — just sets the method
  const handleCardPayment = (paymentData) => {
    setForm(prev => ({ ...prev, paymentMethod: paymentData.paymentMethod }));
    // Immediately submit the form
    if (escrowMode) {
      handleEscrowCheckout({ preventDefault: () => {} });
    } else {
      handleCartCheckout({ preventDefault: () => {} });
    }
  };

  if (initialLoading) return <Spinner />;

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="checkout-success-container">
        <div className="checkout-success-icon">
          <FiCheck />
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          {escrowMode ? t('order:checkoutExtra.escrowPaymentConfirmed', 'Escrow Payment Confirmed!') : t('order:checkoutExtra.orderConfirmed', 'Order Confirmed!')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32 }}>
          {escrowMode 
            ? t('order:checkoutExtra.escrowDesc', 'Your funds are held in escrow and will be released to the artisan as milestones are completed.')
            : t('order:checkoutExtra.orderDesc', "Your order has been placed successfully. You'll receive updates on your dashboard.")
          }
        </p>
        <div className="checkout-success-actions">
          {escrowMode ? (
            <>
              <Button onClick={() => navigate('/dashboard/proposals')}>{t('dashboard:proposals.title', 'View Proposals')}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/payments')}>{t('common:nav.myPayments', 'My Payments')}</Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/dashboard/orders')}>{t('order:orders.title', 'View Orders')}</Button>
              <Button variant="outline" icon={FiFileText} onClick={() => setShowInvoice(true)}>{t('order:checkoutExtra.viewInvoice', 'View Invoice')}</Button>
              <Button variant="outline" onClick={() => navigate('/marketplace')}>{t('order:checkoutExtra.continueShopping', 'Continue Shopping')}</Button>
            </>
          )}
        </div>
        
        {showInvoice && placedOrder && (
          <InvoiceModal 
            order={placedOrder} 
            preloadedItems={placedOrder.items} 
            onClose={() => setShowInvoice(false)} 
          />
        )}
      </div>
    );
  }

  // ── Escrow Checkout Form ──
  if (escrowMode) {
    const amount = Number(escrowPayment?.totalAmount || 0);
    return (
      <div className="checkout-page-container">
        <h1 className="checkout-title">{t('order:checkoutExtra.escrowCheckout', 'Escrow Checkout')}</h1>
        <form onSubmit={handleEscrowCheckout} className="checkout-card">
          
          {/* Escrow Info Banner */}
          <div className="checkout-escrow-banner">
            <FiLock className="checkout-escrow-banner-icon" />
            <div className="checkout-escrow-banner-content">
              <p>{t('order:checkoutExtra.escrowProtected', 'Escrow Protected Payment')}</p>
              <p>
                {t('order:checkoutExtra.escrowProtectedDesc', 'Your funds will be held securely and released to the artisan only when milestones are completed.')}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <h3 className="checkout-section-title">{t('order:checkoutExtra.requestDetails', 'Request Details')}</h3>
          <div className="checkout-split-grid">
            <div className="checkout-grid-item">
              <p className="checkout-grid-item-label">{t('order:checkoutExtra.requestLabel', 'Request')}</p>
              <p className="checkout-grid-item-value">{escrowRequest?.title || `${t('order:checkoutExtra.requestLabel')} #${escrowPayment?.request_id}`}</p>
            </div>
            <div className="checkout-grid-item">
              <p className="checkout-grid-item-label">{t('order:checkoutExtra.categoryLabel', 'Category')}</p>
              <p className="checkout-grid-item-value">{t('common:categories.' + escrowRequest?.category, escrowRequest?.category) || '—'}</p>
            </div>
          </div>

          <h3 className="checkout-section-title" style={{ marginTop: 32 }}>{t('order:checkoutExtra.paymentMethod', 'Payment Method')}</h3>
          
          {/* Payment method selector */}
          <PaymentMethodSelector
            methods={availableMethods}
            selected={form.paymentMethod}
            onSelect={(m) => setForm({ ...form, paymentMethod: m })}
          />

          {/* Card form if Card selected */}
          {form.paymentMethod === 'Card' && (
            <div style={{ marginTop: 24 }}>
              <CardPaymentForm onSubmit={handleCardPayment} loading={loading} amount={amount} />
            </div>
          )}

          {form.paymentMethod !== 'Card' && (
            <>
              <div className="checkout-secure-notice">
                <FiShield /> {t('order:checkoutExtra.paymentSecure', 'Your payment information is secure')}
              </div>

              <div className="checkout-divider" />

              <div className="checkout-details-list">
                <div className="checkout-detail-row">
                  <span>{t('order:checkoutExtra.customRequestEscrow', 'Custom Request Escrow')}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              </div>

              <div className="checkout-divider" />

              <div className="checkout-total-row">
                <span className="checkout-total-label">{t('order:checkoutExtra.totalEscrow', 'Total (Escrow)')}</span>
                <span className="checkout-total-amount">{formatCurrency(amount)}</span>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>{t('order:checkoutExtra.confirmEscrowPayment', 'Confirm Escrow Payment')}</Button>
            </>
          )}
        </form>
      </div>
    );
  }

  // ── Regular Cart Checkout Form ──
  return (
    <div className="checkout-page-container">
      <h1 className="checkout-title">{t('order:checkout.title', 'Checkout')}</h1>
      <form onSubmit={handleCartCheckout} className="checkout-card">
        <h3 className="checkout-section-title">{t('order:checkoutExtra.shippingDetails', 'Shipping Details')}</h3>
        <Input
          label={t('order:checkoutExtra.shippingDetails', 'Shipping Details')}
          value={form.shippingAddress}
          onChange={e => setForm({...form, shippingAddress: e.target.value})}
          placeholder={t('order:checkoutExtra.addressPlaceholder', 'Full delivery address')}
          required
        />

        <h3 className="checkout-section-title" style={{ marginTop: 32 }}>{t('order:checkoutExtra.paymentMethod', 'Payment Method')}</h3>

        {/* Country notice */}
        {buyerCountry && (
          <div className="checkout-country-notice">
            <FiShield size={14} style={{ color: 'var(--gold-primary)' }} />
            {isEgypt 
              ? t('order:checkoutExtra.egyptNotice', 'Cash on Delivery and Bank Card are available for Egypt.') 
              : t('order:checkoutExtra.intlNotice', 'Bank Card payment is required for international orders.')
            }
          </div>
        )}

        {/* Payment method selector */}
        <PaymentMethodSelector
          methods={availableMethods}
          selected={form.paymentMethod}
          onSelect={(m) => setForm({ ...form, paymentMethod: m })}
        />

        {/* Card form if Card selected */}
        {form.paymentMethod === 'Card' && (
          <div style={{ marginTop: 24 }}>
            <CardPaymentForm onSubmit={handleCardPayment} loading={loading} amount={totalPrice} />
          </div>
        )}

        {/* COD or other non-card flow */}
        {form.paymentMethod !== 'Card' && form.paymentMethod && (
          <>
            <div className="checkout-secure-notice">
              <FiShield /> {t('order:checkoutExtra.paymentSecure', 'Your payment information is secure')}
            </div>

            <div className="checkout-divider" />

            {/* Order Summary */}
            <div className="checkout-details-list">
              {items.map(item => (
                <div key={item.id} className="checkout-detail-row">
                  <span>{item.itemName || item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="checkout-divider" />

            <div className="checkout-total-row">
              <span className="checkout-total-label">{t('order:cart.total', 'Total')}</span>
              <span className="checkout-total-amount">{formatCurrency(totalPrice)}</span>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>{t('order:checkout.placeOrder', 'Complete Purchase')}</Button>
          </>
        )}
      </form>
    </div>
  );
}

// ── Payment Method Selector Component ──
function PaymentMethodSelector({ methods, selected, onSelect }) {
  const { t, i18n } = useTranslation(['order']);
  const isRtl = i18n.language === 'ar';
  
  const METHOD_INFO = {
    COD: { label: t('order:checkoutExtra.cod', 'Cash on Delivery'), icon: FiTruck, desc: t('order:checkoutExtra.codDesc', 'Pay when your order arrives') },
    Card: { label: t('order:checkoutExtra.card', 'Bank Card'), icon: FiCreditCard, desc: t('order:checkoutExtra.cardDesc', 'Visa, MasterCard, or other cards') },
  };

  return (
    <div className="payment-selector-grid">
      {methods.map(method => {
        const info = METHOD_INFO[method] || { label: method, icon: FiShield, desc: '' };
        const isActive = selected === method;
        return (
          <div
            key={method}
            onClick={() => onSelect(method)}
            className={`payment-selector-card ${isActive ? 'active' : ''}`}
          >
            <div className="payment-selector-icon-wrapper">
              <info.icon size={20} />
            </div>
            <div className="payment-selector-info">
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{info.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{info.desc}</p>
            </div>
            {isActive && (
              <div className="payment-selector-check">
                <FiCheck size={18} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
