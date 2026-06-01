import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../providers/cart_provider.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My Cart")),
      body: Consumer<CartProvider>(
        builder: (ctx, cartProvider, _) {
          if (cartProvider.items.isEmpty) {
            return EmptyStateWidget(
              icon: Icons.shopping_bag_outlined,
              title: 'Your cart is empty',
              subtitle: 'Start exploring and add items to your cart!',
              actionLabel: 'Shop Now',
              actionIcon: Icons.storefront_outlined,
              onAction: () => Navigator.pushNamed(context, '/home'),
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
                            width: 80,
                            height: 80,
                            child: CustomImage(
                                imageUrl: item.image, borderRadius: 10),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.name,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text("\$ ${item.price.toStringAsFixed(0)}",
                                    style: const TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700)),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    _qtyBtn(Icons.remove, () {
                                      cartProvider.updateQuantity(
                                          item.productId, item.quantity - 1);
                                    }),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 14),
                                      child: Text("${item.quantity}",
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700)),
                                    ),
                                    _qtyBtn(Icons.add, () {
                                      cartProvider.updateQuantity(
                                          item.productId, item.quantity + 1);
                                    }),
                                    const Spacer(),
                                    IconButton(
                                      onPressed: () => cartProvider
                                          .removeFromCart(item.productId),
                                      icon: const Icon(Icons.delete_outline,
                                          color: AppColors.error, size: 20),
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
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, -4))
        ],
      ),
      child: Column(
        children: [
          _summaryRow(
              "Subtotal", "\$ ${cartProvider.subtotal.toStringAsFixed(0)}"),
          const SizedBox(height: 10),
          _summaryRow(
              "Delivery", "\$ ${cartProvider.deliveryFee.toStringAsFixed(0)}"),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: AppColors.divider),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Total",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              Text("\$ ${cartProvider.total.toStringAsFixed(0)}",
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary)),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/checkout');
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
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.divider),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: AppColors.textPrimary),
      ),
    );
  }
}
