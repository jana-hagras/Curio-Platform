import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/market_item_model.dart';
import '../../providers/auth_provider.dart';
import '../../core/api/api_service.dart';

class ArtisanProductsScreen extends StatefulWidget {
  const ArtisanProductsScreen({super.key});

  @override
  State<ArtisanProductsScreen> createState() => _ArtisanProductsScreenState();
}

class _ArtisanProductsScreenState extends State<ArtisanProductsScreen> {
  bool _isLoading = true;
  String? _error;
  List<MarketItemModel> _myProducts = [];

  @override
  void initState() {
    super.initState();
    _loadMyProducts();
  }

  Future<void> _loadMyProducts() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user == null) throw Exception("User not authenticated");

      final res = await ApiService.get('/market-items/all');
      final itemsData = (res['data']['items'] as List?) ?? [];
      
      final allItems = itemsData.map((e) => MarketItemModel.fromJson(e as Map<String, dynamic>)).toList();
      
      // Filter for this artisan
      _myProducts = allItems.where((item) => item.artisanId == user.id).toList();

      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('My Products', style: TextStyle(fontFamily: 'Playfair', fontWeight: FontWeight.w700)),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () {
              // Action for adding product
            },
            icon: const Icon(Icons.add_box_outlined),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadMyProducts, child: const Text('Retry'))
                    ],
                  ),
                )
              : _myProducts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 64, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2)),
                          const SizedBox(height: 16),
                          Text('You have no products listed.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadMyProducts,
                      child: ListView.builder(
                        padding: const EdgeInsets.only(top: 16, bottom: 100, left: 16, right: 16),
                        itemCount: _myProducts.length,
                        itemBuilder: (context, index) {
                          final product = _myProducts[index];
                          return _buildProductCard(context, product);
                        },
                      ),
                    ),
    );
  }

  Widget _buildProductCard(BuildContext context, MarketItemModel product) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
            child: Container(
              width: 120,
              height: 120,
              color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.8), // Placeholder background
              child: product.image != null && product.image!.isNotEmpty
                  ? Image.network(product.image!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildPlaceholder())
                  : _buildPlaceholder(),
            ),
          ),
          const SizedBox(width: 16),
          // Info
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.item,
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 16, fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${product.price.toStringAsFixed(2)}',
                    style: const TextStyle(color: AppColors.gold, fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Stock: ${product.availQuantity}',
                          style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.textMuted),
                        onPressed: () {
                          // Edit product
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return const Center(child: Icon(Icons.image_not_supported_outlined, size: 32, color: AppColors.textMuted));
  }
}
