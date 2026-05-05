import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/market_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/notification_provider.dart';
import '../../shared/widgets/card_shimmer.dart';
import '../../shared/widgets/product_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<String> _categories = [
    "All",
    "Pottery",
    "Textiles",
    "Jewelry",
    "Decor",
    "Vases"
  ];
  int _selectedCat = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MarketProvider>(context, listen: false).fetchItems();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.divider : AppColors.borderLight;

    return Scaffold(
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.all(12),
          child: Image.asset('assets/icons/logo.png'),
        ),
        title: const Text("CURIO",
            style: TextStyle(fontFamily: 'Playfair Display', letterSpacing: 3)),
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
            market.isLoading ? _buildShimmer() : _buildBody(market, isDark, secondaryText, borderColor),
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
        itemBuilder: (_, __) => const CardShimmer(borderRadius: 16),
      ),
    );
  }

  Widget _buildBody(MarketProvider market, bool isDark, Color secondaryText, Color borderColor) {
    final surfaceColor = isDark ? AppColors.surface : AppColors.surfaceLight;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Hero Banner — matches frontend .hero section ──────────
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.dark,
              borderRadius: BorderRadius.circular(16),
              // Gold radial glow like frontend hero::before
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.08),
                  blurRadius: 40,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badge — matches .hero-badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          "✦ Authentic Crafts",
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        "Discover the\nArt of Egypt",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Playfair Display',
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Handmade treasures from\nmaster artisans",
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 13,
                            height: 1.5),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 40,
                        width: 130,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pushNamed(context, '/search'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: Size.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text("Explore", style: TextStyle(fontSize: 13)),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Image.asset('assets/icons/logo.png',
                    width: 80, height: 80, color: AppColors.primary),
              ],
            ),
          ),

          // ── Stats bar — matches frontend .hero-stats ──────────────
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStat("500+", "Artisans", secondaryText),
                Container(width: 1, height: 30, color: borderColor),
                _buildStat("2K+", "Products", secondaryText),
                Container(width: 1, height: 30, color: borderColor),
                _buildStat("10K+", "Happy Buyers", secondaryText),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Category chips — styled like frontend category filters ─
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (_, i) {
                final selected = _selectedCat == i;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedCat = i);
                      Provider.of<MarketProvider>(context, listen: false)
                          .filterByCategory(_categories[i]);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : borderColor),
                        // Gold shadow on selected chip
                        boxShadow: selected ? [
                          BoxShadow(
                            color: AppColors.gold.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ] : [],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _categories[i],
                        style: TextStyle(
                          color: selected ? AppColors.dark : secondaryText,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          // ── Why Choose CURIO — matches frontend features section ─
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildFeatureCard(Icons.verified_user_outlined, "Verified\nArtisans", isDark, surfaceColor, borderColor),
                    const SizedBox(width: 12),
                    _buildFeatureCard(Icons.public_outlined, "Global\nShipping", isDark, surfaceColor, borderColor),
                    const SizedBox(width: 12),
                    _buildFeatureCard(Icons.favorite_outline, "Custom\nOrders", isDark, surfaceColor, borderColor),
                    const SizedBox(width: 12),
                    _buildFeatureCard(Icons.star_outline, "Secure\nPayments", isDark, surfaceColor, borderColor),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Featured Items header — matches frontend section header ─
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Featured Products",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Playfair Display',
                          color: Theme.of(context).colorScheme.onSurface,
                        )),
                    const SizedBox(height: 4),
                    Text("Handpicked artisan creations",
                        style: TextStyle(color: secondaryText, fontSize: 13)),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pushNamed(context, '/search'),
                  child: Row(
                    children: [
                      Text("View All", style: TextStyle(
                        color: AppColors.gold,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      )),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward, size: 14, color: AppColors.gold),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Product Grid ─────────────────────────────────────────
          Consumer<MarketProvider>(
            builder: (ctx, marketProvider, _) {
              final displayItems = marketProvider.items;
              if (displayItems.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.all(40),
                  child: Center(
                      child: Text("No items found",
                          style: TextStyle(color: secondaryText))),
                );
              }
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.68,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                ),
                itemCount: displayItems.length,
                itemBuilder: (_, i) {
                  final item = displayItems[i];
                  return ProductCard(
                    item: item,
                    onTap: () => Navigator.pushNamed(
                        context, '/product-details',
                        arguments: item),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Stat widget — gold values like frontend .hero-stat ─────────
  Widget _buildStat(String value, String label, Color secondaryText) {
    return Column(
      children: [
        Text(value, style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.gold,
          fontFamily: 'Playfair Display',
        )),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(
          fontSize: 11,
          color: secondaryText,
        )),
      ],
    );
  }

  // ── Feature card — matches frontend .feature-card ──────────────
  Widget _buildFeatureCard(IconData icon, String label, bool isDark, Color surfaceColor, Color borderColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.gold, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.textPrimary : AppColors.textPrimaryLight,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
