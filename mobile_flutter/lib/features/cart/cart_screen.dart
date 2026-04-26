import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("My Cart")),
      body: Consumer<CartProvider>(
        builder: (ctx, cartProvider, _) {
          if (cartProvider.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shopping_bag_outlined, size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  const Text("Your cart is empty", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text("Start exploring and add items!", style: TextStyle(fontSize: 14, color: AppColors.textSecondary.withValues(alpha: 0.7))),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: 200,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/home'),
                      child: const Text("Shop Now"),
                    ),
                  ),
                ],
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: cartProvider.items.length,
                  itemBuilder: (_, i) {
                    final item = cartProvider.items[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 80, height: 80,
                            child: CustomImage(imageUrl: item.image, borderRadius: 10),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text("EGP ${item.price.toStringAsFixed(0)}", style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    _qtyBtn(Icons.remove, () {
                                      cartProvider.updateQuantity(item.productId, item.quantity - 1);
                                    }),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 14),
                                      child: Text("${item.quantity}", style: const TextStyle(fontWeight: FontWeight.w700)),
                                    ),
                                    _qtyBtn(Icons.add, () {
                                      cartProvider.updateQuantity(item.productId, item.quantity + 1);
                                    }),
                                    const Spacer(),
                                    IconButton(
                                      onPressed: () => cartProvider.removeFromCart(item.productId),
                                      icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              _buildSummary(context, cartProvider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummary(BuildContext context, CartProvider cartProvider) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: Column(
        children: [
          _summaryRow("Subtotal", "EGP ${cartProvider.subtotal.toStringAsFixed(0)}"),
          const SizedBox(height: 10),
          _summaryRow("Delivery", "EGP ${cartProvider.deliveryFee.toStringAsFixed(0)}"),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: AppColors.divider),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Total", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              Text("EGP ${cartProvider.total.toStringAsFixed(0)}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary)),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () async {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              final orderProvider = Provider.of<OrderProvider>(context, listen: false);
              final notifProvider = Provider.of<NotificationProvider>(context, listen: false);

              if (auth.user == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Please log in to checkout"), backgroundColor: AppColors.error),
                );
                return;
              }

              final order = await orderProvider.placeOrder(
                buyerId: auth.user!.id,
                buyerName: auth.user!.fullName,
                deliveryAddress: auth.user!.address ?? 'Cairo, Egypt',
                cartItems: cartProvider.items,
              );

              await notifProvider.addNotification(
                title: 'Order Placed!',
                body: '${order.orderId} is being processed.',
                icon: 'check_circle',
                color: 'success',
              );

              await cartProvider.clearCart();

              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Order ${order.orderId} placed!"), backgroundColor: AppColors.success),
                );
                Navigator.pop(context);
              }
            },
            child: const Text("Proceed to Checkout"),
          ),
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

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.divider),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: AppColors.textPrimary),
      ),
    );
  }
}
