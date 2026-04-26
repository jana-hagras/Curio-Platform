import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class ReviewsScreen extends StatelessWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Reviews")),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        itemBuilder: (_, i) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                      child: const Icon(Icons.person, size: 18, color: AppColors.primary),
                    ),
                    const SizedBox(width: 10),
                    const Text("Reviewer", style: TextStyle(fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Row(
                      children: List.generate(5, (j) => Icon(
                        j < 4 ? Icons.star_rounded : Icons.star_border_rounded,
                        size: 16, color: AppColors.primary,
                      )),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text("Amazing craftsmanship! The vase arrived in perfect condition and looks even better in person.", style: TextStyle(color: AppColors.textSecondary, height: 1.5, fontSize: 13)),
                const SizedBox(height: 8),
                const Text("2 days ago", style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              ],
            ),
          );
        },
      ),
    );
  }
}
