import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class WorkshopsScreen extends StatelessWidget {
  const WorkshopsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Workshops")),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (_, i) {
          final workshops = [
            ("Pottery Basics", "Hassan El Sayed", "EGP 200", "Mar 15", Icons.emoji_nature),
            ("Textile Weaving", "Fatima Ali", "EGP 350", "Apr 2", Icons.grid_goldenratio),
            ("Jewelry Making", "Ahmed Nour", "EGP 280", "Apr 10", Icons.diamond_outlined),
          ];
          final w = workshops[i];
          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Row(
              children: [
                Container(
                  width: 52, height: 52,
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(w.$5, color: AppColors.primary),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(w.$1, style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text("by ${w.$2}", style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(w.$3, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(w.$4, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
