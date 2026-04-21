import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { orderItemService } from '../../services/orderItemService';
import { paymentService } from '../../services/paymentService';
import { PAYMENT_METHODS } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shippingAddress: user?.address || '',
    paymentMethod: 'Cash',
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shippingAddress) { toast.error('Address is required'); return; }
    
    setLoading(true);
    try {
      // 1. Create order
      const orderRes = await orderService.create({
        buyer_id: user.id,
        orderDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: 'Pending',
        totalAmount: totalPrice,
        shippingAddress: form.shippingAddress
      });
      const orderId = orderRes.data.order.id;

      // 2. Create order items
      await Promise.all(items.map(item => 
        orderItemService.create({
          order_id: orderId,
          item_id: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price
        })
      ));

      // 3. Create payment
      await paymentService.create({
        order_id: orderId,
        amount: totalPrice,
        paymentDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        method: form.paymentMethod,
        status: 'Pending'
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/dashboard/orders');
    } catch (err) {
      toast.error('Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 32, marginBottom: 32 }}>Checkout</h1>
      <form onSubmit={handleSubmit} style={{ background: 'var(--white)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--sand-warm)' }}>
        <h3 style={{ marginBottom: 20 }}>Shipping Details</h3>
        <Input 
          label="Shipping Address" 
          value={form.shippingAddress} 
          onChange={e => setForm({...form, shippingAddress: e.target.value})} 
          placeholder="Full delivery address"
          required
        />
        
        <h3 style={{ margin: '32px 0 20px' }}>Payment Details</h3>
        <Select
          label="Payment Method"
          value={form.paymentMethod}
          onChange={e => setForm({...form, paymentMethod: e.target.value})}
          options={PAYMENT_METHODS}
        />

        <div style={{ borderTop: '1px solid var(--sand-warm)', margin: '32px 0 24px' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Total to Pay</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold-dark)' }}>{formatCurrency(totalPrice)}</span>
        </div>
        
        <Button type="submit" fullWidth size="lg" loading={loading}>Complete Order</Button>
      </form>
    </div>
  );
}
