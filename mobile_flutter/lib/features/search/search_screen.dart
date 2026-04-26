import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/market_provider.dart';
import '../../shared/widgets/card_shimmer.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchCtrl = TextEditingController();
  bool _hasSearched = false;

  void _onSearch(String query) {
    if (query.trim().isEmpty) {
      setState(() => _hasSearched = false);
      return;
    }
    setState(() => _hasSearched = true);
    Provider.of<MarketProvider>(context, listen: false).searchItems(query);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Container(
          height: 44,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: TextField(
            controller: _searchCtrl,
            onSubmitted: _onSearch,
            onChanged: (val) {
              if (val.isEmpty) setState(() => _hasSearched = false);
            },
            decoration: InputDecoration(
              hintText: "Search crafts & artisans...",
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _hasSearched = false);
                      },
                    )
                  : null,
              filled: false,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
      ),
      body: _hasSearched ? _buildResults() : _buildBrowse(),
    );
  }

  Widget _buildResults() {
    return Consumer<MarketProvider>(
      builder: (ctx, market, _) {
        if (market.isLoading) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 14, mainAxisSpacing: 14,
              ),
              itemCount: 4,
              itemBuilder: (_, __) => const CardShimmer(borderRadius: 12),
            ),
          );
        }
        if (market.items.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.search_off, size: 64, color: AppColors.textSecondary),
                SizedBox(height: 16),
                Text("No results found", style: TextStyle(fontSize: 18)),
                SizedBox(height: 8),
                Text("Try a different search term", style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 14, mainAxisSpacing: 14,
          ),
          itemCount: market.items.length,
          itemBuilder: (_, i) {
            final item = market.items[i];
            return GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/product-details', arguments: item),
              child: Container(
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
                        child: const Center(child: Icon(Icons.image_outlined, size: 40, color: AppColors.textSecondary)),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.item, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 4),
                          Text("EGP ${item.price.toStringAsFixed(0)}", style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 14)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBrowse() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Categories", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: [
              _catCard(context, "Pottery", Icons.emoji_nature, AppColors.accentOrange),
              _catCard(context, "Textiles", Icons.grid_goldenratio, AppColors.accentGreen),
              _catCard(context, "Jewelry", Icons.diamond_outlined, AppColors.accentPurple),
              _catCard(context, "Home Decor", Icons.chair_outlined, AppColors.accentBlue),
            ],
          ),
          const SizedBox(height: 32),
          const Text("Recent Searches", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          _recentItem("Ancient Egypt Decor"),
          _recentItem("Handmade Wool Carpet"),
          _recentItem("Custom Ceramic Set"),
        ],
      ),
    );
  }

  Widget _catCard(BuildContext context, String title, IconData icon, Color color) {
    return GestureDetector(
      onTap: () {
        _searchCtrl.text = title;
        _onSearch(title);
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _recentItem(String text) {
    return GestureDetector(
      onTap: () {
        _searchCtrl.text = text;
        _onSearch(text);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            const Icon(Icons.schedule, size: 18, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
            const Spacer(),
            const Icon(Icons.north_west, size: 14, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
