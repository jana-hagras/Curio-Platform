import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Animated success screen shown after a successful order placement.
class OrderConfirmationScreen extends StatefulWidget {
  const OrderConfirmationScreen({super.key});

  @override
  State<OrderConfirmationScreen> createState() =>
      _OrderConfirmationScreenState();
}

class _OrderConfirmationScreenState extends State<OrderConfirmationScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _scaleAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.elasticOut);
    _fadeAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: const Interval(0.3, 1.0, curve: Curves.easeOut),
    );
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final orderId = args?['orderId'] as String? ?? 'ORD-XXXX';
    final totalAmount = args?['totalAmount'] as double?;
    final itemCount = args?['itemCount'] as int?;
    final address = args?['address'] as String?;
    final paymentMethod = args?['paymentMethod'] as String?;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Order Confirmed'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 32),

            // ── Animated check icon ──────────────────────────────
            ScaleTransition(
              scale: _scaleAnim,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: AppColors.success,
                  size: 64,
                ),
              ),
            ),

            const SizedBox(height: 28),

            // ── Thank You ────────────────────────────────────────
            FadeTransition(
              opacity: _fadeAnim,
              child: Column(
                children: [
                  const Text(
                    'Thank you for your order!',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Your order $orderId has been placed successfully\nand is now being processed.',
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                      height: 1.6,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ── Order Details Card ───────────────────────────────
            if (totalAmount != null || address != null || paymentMethod != null)
              FadeTransition(
                opacity: _fadeAnim,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Column(
                    children: [
                      _detailRow(
                        Icons.receipt_long_outlined,
                        'Order ID',
                        orderId,
                      ),
                      if (itemCount != null) ...[
                        const SizedBox(height: 14),
                        _detailRow(
                          Icons.shopping_bag_outlined,
                          'Items',
                          '$itemCount item${itemCount > 1 ? 's' : ''}',
                        ),
                      ],
                      if (address != null) ...[
                        const SizedBox(height: 14),
                        _detailRow(
                          Icons.location_on_outlined,
                          'Delivery',
                          address,
                        ),
                      ],
                      if (paymentMethod != null) ...[
                        const SizedBox(height: 14),
                        _detailRow(
                          paymentMethod == 'Cash on Delivery'
                              ? Icons.money
                              : Icons.credit_card,
                          'Payment',
                          paymentMethod,
                        ),
                      ],
                      if (totalAmount != null) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 14),
                          child: Divider(color: AppColors.divider),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total Paid',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700)),
                            Text(
                              '\$ ${totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 36),

            // ── Action Buttons ───────────────────────────────────
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/orders',
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.local_shipping_outlined, size: 20),
                label: const Text('Track Order'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/home',
                    (route) => false,
                  );
                },
                icon: const Icon(Icons.storefront_outlined, size: 20),
                label: const Text('Continue Shopping'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 10),
        Text(label,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13)),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
