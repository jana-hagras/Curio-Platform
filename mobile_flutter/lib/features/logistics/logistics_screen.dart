import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class LogisticsScreen extends StatelessWidget {
  const LogisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Tracking")),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Order #ORD-1024", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 4),
                  const Text("Handmade Clay Vase", style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  const SizedBox(height: 20),
                  _step("Order Placed", "Mar 25, 2026", true),
                  _step("Artisan Preparing", "Mar 26, 2026", true),
                  _step("Shipped", "Mar 28, 2026", true),
                  _step("Out for Delivery", "Mar 30, 2026", false),
                  _step("Delivered", "", false, isLast: true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _step(String title, String date, bool done, {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 20, height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: done ? AppColors.primary : AppColors.divider,
              ),
              child: done ? const Icon(Icons.check, size: 12, color: Colors.white) : null,
            ),
            if (!isLast) Container(width: 2, height: 36, color: done ? AppColors.primary : AppColors.divider),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: done ? AppColors.textPrimary : AppColors.textSecondary)),
              if (date.isNotEmpty) Text(date, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              SizedBox(height: isLast ? 0 : 16),
            ],
          ),
        ),
      ],
    );
  }
}
