import { useState, useEffect, useRef } from 'react';
import { orderItemService } from '../../services/orderItemService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi';
import Button from './Button';

export default function InvoiceModal({ order, preloadedItems = null, onClose }) {
  const [items, setItems] = useState(preloadedItems || []);
  const [loading, setLoading] = useState(!preloadedItems);
  const printRef = useRef(null);

  useEffect(() => {
    if (!preloadedItems && order?.id) {
      setLoading(true);
      // Try to fetch order items by order.id
      // In orderItemService it is actually order_id as parameter, let's make sure it matches
      orderItemService.getByOrder(order.id)
        .then(res => {
          setItems(res.data?.orderItems || res.data?.items || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [order, preloadedItems]);

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;
    
    // Add print styles dynamically
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        .invoice-print-area, .invoice-print-area * { visibility: visible; }
        .invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(printStyles);
    
    window.print();
    
    document.head.removeChild(printStyles);
  };

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 'var(--z-modal-overlay, 999)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'var(--surface-primary)',
        width: '100%', maxWidth: 700,
        maxHeight: '90vh', overflowY: 'auto',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header Actions */}
        <div className="no-print" style={{ 
          padding: '16px 24px', borderBottom: '1px solid var(--surface-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--surface-primary)', zIndex: 10
        }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Invoice #{order.id}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="outline" size="sm" icon={FiPrinter} onClick={handlePrint}>Print</Button>
            <button onClick={onClose} style={{ fontSize: 24, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <FiX />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="invoice-print-area" style={{ padding: 40 }}>
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <h1 style={{ fontSize: 32, fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)', margin: '0 0 8px 0' }}>CURIO</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Egyptique Artisanal Marketplace</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>INVOICE</h2>
              <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Order #:</strong> {order.id}</p>
              <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Date:</strong> {formatDate(order.orderDate || new Date().toISOString())}</p>
              <p style={{ margin: '4px 0', fontSize: 14 }}>
                <strong>Status:</strong> <span style={{ color: order.status === 'Completed' ? 'var(--success)' : 'var(--warning)' }}>{order.status || 'Paid'}</span>
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div style={{ marginBottom: 40, padding: 20, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: 16, margin: '0 0 12px 0', color: 'var(--text-secondary)' }}>BILLED TO:</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{order.buyerName || 'Customer'}</p>
            {order.shippingAddress && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {order.shippingAddress}
              </p>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                <th style={{ padding: '12px 0', textAlign: 'left', fontSize: 14, color: 'var(--text-secondary)' }}>Item Description</th>
                <th style={{ padding: '12px 0', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>Qty</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 14, color: 'var(--text-secondary)' }}>Price</th>
                <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 14, color: 'var(--text-secondary)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading items...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No items found</td></tr>
              ) : (
                items.map((item, index) => {
                  // handle different item structures depending on if it's from checkout state or db
                  const name = item.itemName || item.name || `Item #${item.item_id}`;
                  const price = Number(item.priceAtPurchase || item.price || 0);
                  const qty = Number(item.quantity || 1);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '16px 0', fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: '16px 0', textAlign: 'center' }}>{qty}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>{formatCurrency(price)}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(price * qty)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--surface-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: 20, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--gold-primary)' }}>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            <p>Thank you for shopping at Curio.</p>
            <p>If you have any questions about this invoice, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
