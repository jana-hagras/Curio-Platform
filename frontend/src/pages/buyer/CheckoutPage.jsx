import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { orderItemService } from '../../services/orderItemService';
import { paymentService } from '../../services/paymentService';
import { requestService } from '../../services/requestService';
import { PAYMENT_METHODS } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiShield, FiCheck, FiFileText, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import InvoiceModal from '../../components/ui/InvoiceModal';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [step, setStep] = useState('form'); // form | success
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [form, setForm] = useState({
    shippingAddress: user?.address || '',
    paymentMethod: 'Cash',
  });

  // Escrow checkout state
  const [escrowMode, setEscrowMode] = useState(false);
  const [escrowPayment, setEscrowPayment] = useState(null);
  const [escrowRequest, setEscrowRequest] = useState(null);

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
          toast.error('Failed to load payment details');
          navigate('/dashboard/proposals');
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [searchParams, navigate]);

  // Redirect to cart if regular checkout with empty cart
  if (!initialLoading && !escrowMode && items.length === 0 && step !== 'success') {
    navigate('/cart');
    return null;
  }

  // ── Regular Cart Checkout ──
  const handleCartCheckout = async (e) => {
    e.preventDefault();
    if (!form.shippingAddress) { toast.error('Address is required'); return; }

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
      if (!orderId) throw new Error('Failed to create order');

      // 2. Create order items
      for (const item of items) {
        await orderItemService.create({
          order_id: orderId,
          item_id: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price
        });
      }

      // 3. Create payment
      await paymentService.create({
        order_id: orderId,
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
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err?.message || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Escrow Payment Checkout ──
  const handleEscrowCheckout = async (e) => {
    e.preventDefault();
    if (!escrowPayment) { toast.error('Payment data missing'); return; }

    setLoading(true);
    try {
      // Update the pending escrow payment to Completed with selected method
      await paymentService.update(escrowPayment.id, {
        status: 'Completed',
        paymentMethod: form.paymentMethod,
      });

      setStep('success');
      toast.success('Escrow payment confirmed! Funds are now held securely.');
    } catch (err) {
      console.error('Escrow checkout error:', err);
      toast.error(err?.message || 'Failed to process escrow payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Spinner />;

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="container" style={{ padding: '80px 24px', maxWidth: 600, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px', animation: 'scaleIn 0.4s ease' }}>
          <FiCheck />
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          {escrowMode ? 'Escrow Payment Confirmed!' : 'Order Confirmed!'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32 }}>
          {escrowMode 
            ? 'Your funds are held in escrow and will be released to the artisan as milestones are completed.'
            : "Your order has been placed successfully. You'll receive updates on your dashboard."
          }
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {escrowMode ? (
            <>
              <Button onClick={() => navigate('/dashboard/proposals')}>View Proposals</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/payments')}>My Payments</Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/dashboard/orders')}>View Orders</Button>
              <Button variant="outline" icon={FiFileText} onClick={() => setShowInvoice(true)}>View Invoice</Button>
              <Button variant="outline" onClick={() => navigate('/marketplace')}>Continue Shopping</Button>
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
      <div className="container" style={{ padding: '40px 24px', maxWidth: 800 }}>
        <h1 style={{ fontSize: 28, marginBottom: 32 }}>Escrow Checkout</h1>
        <form onSubmit={handleEscrowCheckout} style={{ background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
          
          {/* Escrow Info Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', marginBottom: 24, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <FiLock style={{ color: '#3B82F6', fontSize: 20, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#3B82F6', marginBottom: 2 }}>Escrow Protected Payment</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Your funds will be held securely and released to the artisan only when milestones are completed.
              </p>
            </div>
          </div>

          {/* Request Details */}
          <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600 }}>Request Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Request</p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{escrowRequest?.title || `Request #${escrowPayment?.request_id}`}</p>
            </div>
            <div style={{ background: 'var(--surface-secondary)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Category</p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{escrowRequest?.category || '—'}</p>
            </div>
          </div>

          <h3 style={{ margin: '32px 0 20px', fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600 }}>Payment Method</h3>
          <Select
            label="Payment Method"
            value={form.paymentMethod}
            onChange={e => setForm({...form, paymentMethod: e.target.value})}
            options={PAYMENT_METHODS}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: 13 }}>
            <FiShield /> Your payment information is secure
          </div>

          <div style={{ borderTop: '1px solid var(--surface-border)', margin: '24px 0 20px' }} />

          {/* Payment Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span>Custom Request Escrow</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--surface-border)', margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Total (Escrow)</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold-primary)' }}>{formatCurrency(amount)}</span>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>Confirm Escrow Payment</Button>
        </form>
      </div>
    );
  }

  // ── Regular Cart Checkout Form ──
  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 28, marginBottom: 32 }}>Checkout</h1>
      <form onSubmit={handleCartCheckout} style={{ background: 'var(--surface-primary)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600 }}>Shipping Details</h3>
        <Input
          label="Shipping Address"
          value={form.shippingAddress}
          onChange={e => setForm({...form, shippingAddress: e.target.value})}
          placeholder="Full delivery address"
          required
        />

        <h3 style={{ margin: '32px 0 20px', fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600 }}>Payment Method</h3>
        <Select
          label="Payment Method"
          value={form.paymentMethod}
          onChange={e => setForm({...form, paymentMethod: e.target.value})}
          options={PAYMENT_METHODS}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: 13 }}>
          <FiShield /> Your payment information is secure
        </div>

        <div style={{ borderTop: '1px solid var(--surface-border)', margin: '24px 0 20px' }} />

        {/* Order Summary */}
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
            <span>{item.itemName || item.name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--surface-border)', margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold-primary)' }}>{formatCurrency(totalPrice)}</span>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>Complete Purchase</Button>
      </form>
    </div>
  );
}
