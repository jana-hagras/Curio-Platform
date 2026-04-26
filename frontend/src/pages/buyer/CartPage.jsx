import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <EmptyState
          icon={FiShoppingCart}
          title="Your cart is empty"
          message="Looks like you haven't added any items to your cart yet."
          action={<Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 32 }}>Shopping Cart</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 16, background: 'var(--surface-primary)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
              <img src={item.image || 'https://via.placeholder.com/100'} alt={item.item} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 16, marginBottom: 4 }}>{item.item}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatCurrency(item.price)} each</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{ color: 'var(--error)', padding: 8 }}><FiTrash2 size={18} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '6px 10px' }}><FiMinus size={14} /></button>
                    <span style={{ fontSize: 14, fontWeight: 600, width: 30, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '6px 10px' }}><FiPlus size={14} /></button>
                  </div>
                  <strong style={{ marginLeft: 'auto', fontSize: 16 }}>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={clearCart} style={{ alignSelf: 'flex-start', color: 'var(--error)' }}>Clear Cart</Button>
        </div>
        
        <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)', position: 'sticky', top: 100 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
            <span>Subtotal ({items.length} items)</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15, color: 'var(--text-secondary)' }}>
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div style={{ borderTop: '1px solid var(--surface-border)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>Proceed to Checkout <FiArrowRight /></Button>
        </div>
      </div>
    </div>
  );
}
