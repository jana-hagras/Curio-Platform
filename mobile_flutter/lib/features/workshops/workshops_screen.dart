import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';

class WorkshopsScreen extends StatelessWidget {
  const WorkshopsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Workshops & Mentorship', style: TextStyle(fontFamily: 'Playfair', fontSize: 20)),
      ),
      body: DefaultTabController(
        length: 2,
        child: Column(
          children: [
            const TabBar(
              indicatorColor: AppColors.gold,
              labelColor: AppColors.gold,
              unselectedLabelColor: AppColors.textMuted,
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: AppColors.divider,
              tabs: [
                Tab(text: 'Workshops'),
                Tab(text: 'Mentorship'),
              ],
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _WorkshopsTab(),
                  _MentorshipTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkshopsTab extends StatelessWidget {
  final List<Map<String, String>> workshops = [
    {
      'title': 'Pottery Basics: Wheel Throwing',
      'description': 'Learn the fundamentals of wheel throwing with master artisan Sarah. Perfect for absolute beginners.',
      'image': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80',
      'duration': '2 Hours',
      'mentor': 'Sarah Jenkins',
    },
    {
      'title': 'Textile Weaving Masterclass',
      'description': 'Discover the ancient art of loom weaving. Create your own patterned tapestry.',
      'image': 'https://images.unsplash.com/photo-1605282715099-a864d2d46e3e?w=600&q=80',
      'duration': '3 Hours',
      'mentor': 'Elena R.',
    },
    {
      'title': 'Jewelry Making: Silver Smithing',
      'description': 'Craft your own silver ring from scratch. Includes materials and safety briefing.',
      'image': 'https://images.unsplash.com/photo-1599643478524-fb467ce422c5?w=600&q=80',
      'duration': '4 Hours',
      'mentor': 'David Chen',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: workshops.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (ctx, i) => _FeatureCard(data: workshops[i], isWorkshop: true),
    );
  }
}

class _MentorshipTab extends StatelessWidget {
  final List<Map<String, String>> mentorships = [
    {
      'title': '1-on-1 Artisan Career Coaching',
      'description': 'Get personalized advice on how to price your art, market yourself, and grow your local business.',
      'image': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
      'duration': '45 Mins',
      'mentor': 'Michael T.',
    },
    {
      'title': 'Digital Marketing for Crafters',
      'description': 'Learn how to leverage social media and online platforms to sell your handmade goods.',
      'image': 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&q=80',
      'duration': '1 Hour',
      'mentor': 'Jessica W.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: mentorships.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (ctx, i) => _FeatureCard(data: mentorships[i], isWorkshop: false),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final Map<String, String> data;
  final bool isWorkshop;

  const _FeatureCard({required this.data, required this.isWorkshop});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 160,
            width: double.infinity,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: CustomImage(imageUrl: data['image']!),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        isWorkshop ? 'Workshop' : 'Mentorship',
                        style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(data['duration']!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  data['title']!,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  data['description']!,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.person_outline, size: 16, color: AppColors.textMuted),
                        const SizedBox(width: 6),
                        Text('By ${data['mentor']!}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Booked ${data['title']}!')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(80, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Book Now'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
