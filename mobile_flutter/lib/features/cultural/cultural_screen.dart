import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class CulturalScreen extends StatelessWidget {
  const CulturalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Cultural Stories")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _storyCard("The Art of Egyptian Pottery", "Discover how artisans shape clay using techniques from 3000 BC.", Icons.history_edu),
          _storyCard("Weaving Heritage", "Hand-loomed textiles carry patterns passed through generations.", Icons.auto_awesome),
          _storyCard("Pharaonic Jewelry", "Gold and precious stones shaped into wearable art.", Icons.diamond_outlined),
        ],
      ),
    );
  }

  Widget _storyCard(String title, String desc, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 6),
                Text(desc, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
