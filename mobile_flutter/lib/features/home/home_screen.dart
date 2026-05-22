import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/market_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/notification_provider.dart';
import '../../shared/widgets/card_shimmer.dart';
import '../../shared/widgets/product_card.dart';
import '../../shared/widgets/app_drawer.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MarketProvider>(context, listen: false).fetchItems();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/icons/logo.png', height: 20),
            const SizedBox(width: 8),
            const Text("CURIO", style: TextStyle(letterSpacing: 3, fontSize: 16)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/search'),
            icon: const Icon(Icons.search, size: 22),
          ),
          Stack(
            children: [
              IconButton(
                onPressed: () => Navigator.pushNamed(context, '/notifications'),
                icon: const Icon(Icons.notifications_outlined, size: 22),
              ),
              Consumer<NotificationProvider>(
                builder: (ctx, notifProvider, _) {
                  if (notifProvider.unreadCount == 0) return const SizedBox();
                  return Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                          color: AppColors.error, shape: BoxShape.circle),
                      child: Text(
                        '${notifProvider.unreadCount}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          Stack(
            children: [
              IconButton(
                onPressed: () => Navigator.pushNamed(context, '/cart'),
                icon: const Icon(Icons.shopping_bag_outlined, size: 22),
              ),
              Consumer<CartProvider>(
                builder: (ctx, cartProvider, _) {
                  if (cartProvider.itemCount == 0) return const SizedBox();
                  return Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                          color: AppColors.primary, shape: BoxShape.circle),
                      child: Text(
                        '${cartProvider.itemCount}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
      body: Consumer<MarketProvider>(
        builder: (ctx, market, _) =>
            market.isLoading ? _buildShimmer() : _buildBody(market),
      ),
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.72,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => const CardShimmer(borderRadius: 12),
      ),
    );
  }

  Widget _buildBody(MarketProvider market) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Section
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Text(
              "Discover\nExceptional Craft",
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                height: 1.1,
              ),
            ),
          ),
          
          // Quick Access Grid
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildQuickAccess(context, Icons.auto_awesome, "Custom", "/custom-order", AppColors.primary),
                _buildQuickAccess(context, Icons.handyman, "Workshops", "/workshops", Colors.orange),
                _buildQuickAccess(context, Icons.school, "Mentors", "/workshops", Colors.teal),
                _buildQuickAccess(context, Icons.request_quote, "Proposals", "/proposals", Colors.indigo),
              ],
            ),
          ),

          // Featured Action Banner
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/workshops'),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.dark, AppColors.textPrimary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  )
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            "MASTERCLASSES",
                            style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          "Learn from\nTop Artisans",
                          style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, height: 1.2),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.gold, size: 20),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Curated for You", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/search'),
                  child: const Text("See All", style: TextStyle(fontSize: 13, color: AppColors.gold)),
                ),
              ],
            ),
          ),

          // Product Grid
          Consumer<MarketProvider>(
            builder: (ctx, marketProvider, _) {
              final displayItems = marketProvider.items;
              if (displayItems.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: Text("No items found", style: TextStyle(color: AppColors.textSecondary))),
                );
              }
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).padding.bottom + 100),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.65, // Taller for more luxury feel
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: displayItems.length,
                itemBuilder: (_, i) {
                  final item = displayItems[i];
                  return ProductCard(
                    item: item,
                    onTap: () => Navigator.pushNamed(context, '/product-details', arguments: item),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAccess(BuildContext context, IconData icon, String label, String route, Color color) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, route),
      child: Column(
        children: [
          Container(
            height: 64,
            width: 64,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: color.withValues(alpha: 0.2)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
