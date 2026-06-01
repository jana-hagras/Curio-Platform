import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/order_provider.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/empty_state_widget.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final orderProvider = Provider.of<OrderProvider>(context);
    final userOrders = auth.user != null
        ? orderProvider.getOrdersForUser(auth.user!.id)
        : orderProvider.orders;

    return Scaffold(
      appBar: AppBar(title: const Text("My Orders")),
      body: orderProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : userOrders.isEmpty
              ? EmptyStateWidget(
                  icon: Icons.receipt_long_outlined,
                  title: 'No orders yet',
                  subtitle: 'Your orders will appear here once you make a purchase.',
                  actionLabel: 'Start Shopping',
                  actionIcon: Icons.storefront_outlined,
                  onAction: () => Navigator.pushNamed(context, '/home'),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: userOrders.length,
                  itemBuilder: (_, i) {
                    final order = userOrders[i];
                    final statusColor = _getStatusColor(order.status);
                    return InkWell(
                      onTap: () => Navigator.pushNamed(context, '/order-details',
                          arguments: order),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.inventory_2_outlined,
                                  color: statusColor, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.items.isNotEmpty
                                        ? order.items.first['name'] ?? 'Order'
                                        : 'Order',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(order.orderId,
                                      style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 12)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(order.status,
                                  style: TextStyle(
                                      color: statusColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Delivered':
        return AppColors.success;
      case 'In Transit':
        return AppColors.primary;
      case 'Processing':
        return AppColors.warning;
      case 'Cancelled':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }
}

