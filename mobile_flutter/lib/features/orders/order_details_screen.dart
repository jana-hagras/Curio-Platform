import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../models/order_model.dart';
import '../../providers/order_provider.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final routeOrder =
        ModalRoute.of(context)?.settings.arguments as OrderModel?;
    if (routeOrder == null) {
      return const Scaffold(body: Center(child: Text('Order not found')));
    }

    return Consumer<OrderProvider>(
      builder: (context, orders, _) {
        final order = orders.orders.cast<OrderModel?>().firstWhere(
              (item) => item?.id == routeOrder.id,
              orElse: () => routeOrder,
            )!;
        final total = order.totalAmount > 0
            ? order.totalAmount
            : order.items.fold<double>(
                0,
                (sum, item) =>
                    sum +
                    ((item['price'] ?? 0).toDouble() * (item['quantity'] ?? 1)),
              );

        return Scaffold(
          appBar: AppBar(title: Text(order.orderId)),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(order.orderId,
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800)),
                        ),
                        _StatusPill(status: order.status),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Delivery: ${order.deliveryAddress ?? 'Not set'}'),
                    const SizedBox(height: 6),
                    Text('Placed: ${order.orderDate ?? '-'}'),
                    const SizedBox(height: 6),
                    Text('Total: \$ ${total.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('Tracking',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              _TrackingTimeline(status: order.status),
              const SizedBox(height: 20),
              const Text('Items',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              ...order.items.map((item) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(item['name']?.toString() ?? 'Item'),
                    subtitle: Text('Qty ${item['quantity'] ?? 1}'),
                    trailing: Text(
                      '\$ ${((item['price'] ?? 0).toDouble()).toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  )),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _canAdvance(order.status)
                    ? () => context.read<OrderProvider>().advanceOrder(order.id)
                    : null,
                icon: const Icon(Icons.local_shipping_outlined),
                label: Text(_advanceLabel(order.status)),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () {
                  final artisanId = order.artisanId ??
                      (order.items.isNotEmpty
                          ? order.items.first['artisanId'] as int?
                          : null);
                  if (artisanId == null) return;
                  Navigator.pushNamed(context, '/chat', arguments: {
                    'peerId': artisanId,
                    'peerName': 'Artisan',
                  });
                },
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Message Artisan'),
              ),
            ],
          ),
        );
      },
    );
  }

  bool _canAdvance(String status) {
    return status == 'Pending' ||
        status == 'Processing' ||
        status == 'In Transit' ||
        status == 'Shipped';
  }

  String _advanceLabel(String status) {
    return switch (status) {
      'Pending' => 'Mark Processing',
      'Processing' => 'Mark Shipped',
      'In Transit' => 'Mark Delivered',
      'Shipped' => 'Mark Delivered',
      _ => 'Delivered',
    };
  }
}

class _TrackingTimeline extends StatelessWidget {
  final String status;

  const _TrackingTimeline({required this.status});

  @override
  Widget build(BuildContext context) {
    const steps = ['Processing', 'Shipped', 'Delivered'];
    final activeIndex = switch (status) {
      'Delivered' || 'Completed' => 2,
      'Shipped' || 'In Transit' => 1,
      _ => 0,
    };

    return Column(
      children: List.generate(steps.length, (index) {
        final active = index <= activeIndex;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                CircleAvatar(
                  radius: 13,
                  backgroundColor:
                      active ? AppColors.primary : AppColors.divider,
                  child: Icon(active ? Icons.check : Icons.circle,
                      size: 13, color: Colors.white),
                ),
                if (index != steps.length - 1)
                  Container(
                    width: 2,
                    height: 32,
                    color: active ? AppColors.primary : AppColors.divider,
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text(steps[index],
                    style: TextStyle(
                        fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                        color: active
                            ? AppColors.textPrimary
                            : AppColors.textSecondary)),
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;

  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'Delivered' || 'Completed' => AppColors.success,
      'Shipped' || 'In Transit' => AppColors.primary,
      'Processing' => AppColors.warning,
      'Cancelled' => AppColors.error,
      _ => AppColors.textSecondary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(status,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }
}
