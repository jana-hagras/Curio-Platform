import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _address = '';
  String _payment = 'Cash on Delivery';
  bool _isPlacing = false;
  late TextEditingController _addressCtrl;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _address = auth.user?.address ?? 'Cairo, Egypt';
    _addressCtrl = TextEditingController(text: _address);
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (_address.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a delivery address'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isPlacing = true);

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final cart = Provider.of<CartProvider>(context, listen: false);
    final orderProv = Provider.of<OrderProvider>(context, listen: false);
    final notif = Provider.of<NotificationProvider>(context, listen: false);

    if (auth.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to continue')),
      );
      setState(() => _isPlacing = false);
      return;
    }

    try {
      final order = await orderProv.placeOrder(
        buyerId: auth.user!.id,
        buyerName: auth.user!.fullName,
        deliveryAddress: _address,
        cartItems: cart.items,
      );

      await notif.addNotification(
        title: 'Order Placed',
        body: '${order.orderId} is processing',
        icon: 'check_circle',
        color: 'success',
      );
      await cart.clearCart();

      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/order-confirmation',
          (r) => false,
          arguments: {'orderId': order.orderId},
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to place order. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isPlacing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Shipping Address ───────────────────────────────
                _sectionTitle('Shipping Address'),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.divider),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _addressCtrl,
                    onChanged: (v) => _address = v,
                    decoration: const InputDecoration(
                      hintText: 'Full delivery address',
                      border: InputBorder.none,
                      icon: Icon(Icons.location_on_outlined,
                          color: AppColors.primary, size: 20),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ── Payment Method ─────────────────────────────────
                _sectionTitle('Payment Method'),
                const SizedBox(height: 10),
                _paymentTile(
                  icon: Icons.money,
                  label: 'Cash on Delivery',
                  subtitle: 'Pay when your order arrives',
                  value: 'Cash on Delivery',
                ),
                const SizedBox(height: 10),
                _paymentTile(
                  icon: Icons.credit_card,
                  label: 'Credit / Debit Card',
                  subtitle: 'Visa, Mastercard (mock)',
                  value: 'Credit/Debit Card',
                ),

                // Secure badge
                Container(
                  margin: const EdgeInsets.only(top: 16),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.shield_outlined,
                          size: 16, color: AppColors.success),
                      SizedBox(width: 8),
                      Text('Your payment information is secure',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.success)),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // ── Order Summary ──────────────────────────────────
                _sectionTitle('Order Summary'),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.divider),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      ...cart.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    '${item.name} × ${item.quantity}',
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ),
                                Text(
                                  '\$ ${item.total.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14),
                                ),
                              ],
                            ),
                          )),
                      const Divider(color: AppColors.divider),
                      const SizedBox(height: 4),
                      _summaryRow('Subtotal',
                          '\$ ${cart.subtotal.toStringAsFixed(0)}'),
                      const SizedBox(height: 6),
                      _summaryRow('Delivery Fee',
                          '\$ ${cart.deliveryFee.toStringAsFixed(0)}'),
                      const SizedBox(height: 10),
                      const Divider(color: AppColors.divider),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total',
                              style: TextStyle(
                                  fontSize: 17, fontWeight: FontWeight.w800)),
                          Text('\$ ${cart.total.toStringAsFixed(0)}',
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom Bar ───────────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _isPlacing ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isPlacing
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text('Complete Purchase',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  Widget _sectionTitle(String text) {
    return Text(text,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700));
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _paymentTile({
    required IconData icon,
    required String label,
    required String subtitle,
    required String value,
  }) {
    final selected = _payment == value;
    return GestureDetector(
      onTap: () => setState(() => _payment = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.06)
              : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.divider,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon,
                color: selected ? AppColors.primary : AppColors.textSecondary,
                size: 22),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: selected
                              ? AppColors.primary
                              : AppColors.textPrimary)),
                  Text(subtitle,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? AppColors.primary : AppColors.textSecondary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
