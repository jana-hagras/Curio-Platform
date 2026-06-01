import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';

/// Pre-confirmation review screen showing all order details before placing.
class OrderSummaryScreen extends StatefulWidget {
  const OrderSummaryScreen({super.key});

  @override
  State<OrderSummaryScreen> createState() => _OrderSummaryScreenState();
}

class _OrderSummaryScreenState extends State<OrderSummaryScreen> {
  bool _isPlacing = false;

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final address = args?['address'] as String? ?? 'Cairo, Egypt';
    final paymentMethod =
        args?['paymentMethod'] as String? ?? 'Cash on Delivery';
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Review Order')),
      body: cart.items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.remove_shopping_cart_outlined,
                      size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  const Text('Cart is empty',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                        context, '/home', (r) => false),
                    child: const Text('Go Shopping'),
                  ),
                ],
              ),
            )
          : Stack(
              children: [
                ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
                  children: [
                    // ── Delivery Address ─────────────────────────────
                    _sectionCard(
                      icon: Icons.location_on_outlined,
                      title: 'Delivery Address',
                      child: Text(address,
                          style: const TextStyle(
                              fontSize: 14, height: 1.5)),
                    ),
                    const SizedBox(height: 14),

                    // ── Payment Method ───────────────────────────────
                    _sectionCard(
                      icon: paymentMethod == 'Cash on Delivery'
                          ? Icons.money
                          : Icons.credit_card,
                      title: 'Payment Method',
                      child: Text(paymentMethod,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 14),

                    // ── Items ────────────────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.divider),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.shopping_bag_outlined,
                                  size: 18, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Text(
                                'Items (${cart.itemCount})',
                                style: const TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          ...cart.items.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: SizedBox(
                                        width: 56,
                                        height: 56,
                                        child: CustomImage(
                                            imageUrl: item.image,
                                            borderRadius: 8),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(item.name,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 14)),
                                          const SizedBox(height: 2),
                                          Text('Qty: ${item.quantity}',
                                              style: const TextStyle(
                                                  color:
                                                      AppColors.textSecondary,
                                                  fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '\$ ${item.total.toStringAsFixed(0)}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              )),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // ── Price Breakdown ──────────────────────────────
                    Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.divider),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _summaryRow('Subtotal',
                              '\$ ${cart.subtotal.toStringAsFixed(0)}'),
                          const SizedBox(height: 8),
                          _summaryRow('Delivery Fee',
                              '\$ ${cart.deliveryFee.toStringAsFixed(0)}'),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(color: AppColors.divider),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total',
                                  style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800)),
                              Text(
                                '\$ ${cart.total.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // ── Bottom Bar ────────────────────────────────────────
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 16,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Secure badge
                        Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.shield_outlined,
                                  size: 14, color: AppColors.success),
                              SizedBox(width: 6),
                              Text('Your order is protected by Curio',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.success,
                                      fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: double.infinity,
                          height: 54,
                          child: ElevatedButton(
                            onPressed: _isPlacing
                                ? null
                                : () => _placeOrder(address, paymentMethod),
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
                                : Text(
                                    'Place Order · \$ ${cart.total.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _placeOrder(String address, String paymentMethod) async {
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
        deliveryAddress: address,
        cartItems: cart.items,
      );

      await notif.addNotification(
        title: 'Order Placed',
        body: '${order.orderId} is processing',
        icon: 'check_circle',
        color: 'success',
      );

      // Store order details before clearing cart
      final orderTotal = cart.total;
      final orderItemCount = cart.itemCount;
      await cart.clearCart();

      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/order-confirmation',
          (r) => false,
          arguments: {
            'orderId': order.orderId,
            'totalAmount': orderTotal,
            'itemCount': orderItemCount,
            'address': address,
            'paymentMethod': paymentMethod,
          },
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

  Widget _sectionCard({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
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
}
