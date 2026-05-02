import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/market_provider.dart';
import '../../providers/favorite_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/notification_provider.dart';
import '../../shared/widgets/card_shimmer.dart';
import '../../shared/widgets/custom_image.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _navIndex = 0;

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
    return Scaffold(
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.all(12),
          child: Image.asset('assets/icons/logo.png'),
        ),
        title: const Text("CURIO",
            style: TextStyle(fontFamily: 'Playfair', letterSpacing: 3)),
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
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _navIndex,
        onTap: (i) {
          setState(() => _navIndex = i);
          if (i == 1) Navigator.pushNamed(context, '/search');
          if (i == 2) Navigator.pushNamed(context, '/favorites');
          if (i == 3) Navigator.pushNamed(context, '/profile');
        },
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: "Home"),
          BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore),
              label: "Explore"),
          BottomNavigationBarItem(
              icon: Icon(Icons.favorite_outline),
              activeIcon: Icon(Icons.favorite),
              label: "Saved"),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: "Profile"),
        ],
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
          // Hero Banner
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.dark,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "New\nCollection",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Playfair',
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Handmade with love",
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 40,
                        width: 120,
                        child: ElevatedButton(
                          onPressed: () {},
                          style:
                              ElevatedButton.styleFrom(minimumSize: Size.zero),
                          child: const Text("Shop Now",
                              style: TextStyle(fontSize: 13)),
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

          const SizedBox(height: 24),

          // Category chips
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
                        color:
                            selected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : AppColors.divider),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _categories[i],
                        style: TextStyle(
                          color:
                              selected ? Colors.white : AppColors.textSecondary,
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

          // Workshops Banner
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/workshops'),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.dark, AppColors.surfaceLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Learn from Masters",
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Playfair',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Book workshops & mentorship sessions",
                          style: TextStyle(
                              color: AppColors.textPrimary.withValues(alpha: 0.7),
                              fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.gold, size: 16),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Featured Items",
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/search'),
                  child: const Text("See All", style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
          ),

          // Product Grid — dynamic from local storage
          Consumer<MarketProvider>(
            builder: (ctx, marketProvider, _) {
              final displayItems = marketProvider.items;
              if (displayItems.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                      child: Text("No items found",
                          style: TextStyle(color: AppColors.textSecondary))),
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
                  return GestureDetector(
                    onTap: () => Navigator.pushNamed(
                        context, '/product-details',
                        arguments: item),
                    child: _ProductCard(
                      id: item.id.toString(),
                      title: item.item,
                      price: "EGP ${item.price.toStringAsFixed(0)}",
                      image: item.image,
                      item: item,
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final String id, title, price;
  final String? image;
  final dynamic item;
  const _ProductCard(
      {required this.id,
      required this.title,
      required this.price,
      this.image,
      this.item});

  @override
  Widget build(BuildContext context) {
    final favProvider = Provider.of<FavoriteProvider>(context);
    final isFav = favProvider.isFavorite(id);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Stack(
                children: [
                  Center(child: CustomImage(imageUrl: image, borderRadius: 12)),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () => favProvider.toggleFavorite(id),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                            color: Colors.white, shape: BoxShape.circle),
                        child: Icon(
                            isFav ? Icons.favorite : Icons.favorite_border,
                            color: isFav ? Colors.red : AppColors.textSecondary,
                            size: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(price,
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
