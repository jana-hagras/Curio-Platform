import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../core/theme/app_colors.dart';
import '../../models/market_item_model.dart';
import '../../providers/auth_provider.dart';
import '../../core/api/api_service.dart';
import '../../shared/widgets/custom_image.dart';
import 'artisan_requests_screen.dart';

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
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user == null) throw Exception("User not authenticated");

      final res = await ApiService.get('/market-items/all');
      final itemsData = (res['data']['items'] as List?) ?? [];

      final allItems = itemsData
          .map((e) => MarketItemModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // Filter for this artisan
      _myProducts =
          allItems.where((item) => item.artisanId == user.id).toList();

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

  Future<void> _editProduct(MarketItemModel product) async {
    final nameCtrl = TextEditingController(text: product.item);
    final descCtrl = TextEditingController(text: product.description ?? '');
    final priceCtrl =
        TextEditingController(text: product.price.toStringAsFixed(2));
    final qtyCtrl =
        TextEditingController(text: product.availQuantity.toString());
    final imageCtrl = TextEditingController(text: product.image ?? '');
    String selectedCategory = product.category ?? 'Pottery';
    String? pickedImagePath;

    Future<void> pickImage(
        void Function(void Function()) setDialogState) async {
      final picker = ImagePicker();
      final picked =
          await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (picked == null) return;
      setDialogState(() {
        pickedImagePath = picked.path;
        imageCtrl.clear();
      });
    }

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Edit Product'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                    controller: nameCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Product name')),
                const SizedBox(height: 10),
                TextField(
                    controller: descCtrl,
                    maxLines: 3,
                    decoration:
                        const InputDecoration(labelText: 'Description')),
                const SizedBox(height: 10),
                TextField(
                    controller: priceCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Price')),
                const SizedBox(height: 10),
                TextField(
                    controller: qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity')),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: selectedCategory,
                  items: const [
                    'Pottery',
                    'Textiles',
                    'Jewelry',
                    'Decor',
                    'Ceramic'
                  ]
                      .map((value) =>
                          DropdownMenuItem(value: value, child: Text(value)))
                      .toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    setDialogState(() => selectedCategory = value);
                  },
                  decoration: const InputDecoration(labelText: 'Category'),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => pickImage(setDialogState),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('Gallery'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: imageCtrl,
                        onChanged: (value) {
                          if (value.isNotEmpty) {
                            setDialogState(() => pickedImagePath = null);
                          }
                        },
                        decoration:
                            const InputDecoration(labelText: 'Image URL'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (pickedImagePath != null || imageCtrl.text.trim().isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: SizedBox(
                      height: 140,
                      width: double.infinity,
                      child: pickedImagePath != null
                          ? Image.file(File(pickedImagePath!),
                              fit: BoxFit.cover)
                          : Image.network(imageCtrl.text.trim(),
                              fit: BoxFit.cover),
                    ),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel')),
            ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Save')),
          ],
        ),
      ),
    );

    if (saved != true) return;

    final payloadImage = pickedImagePath ?? imageCtrl.text.trim();
    final payload = {
      'item': nameCtrl.text.trim(),
      'description': descCtrl.text.trim(),
      'price': double.tryParse(priceCtrl.text.trim()) ?? product.price,
      'availQuantity':
          int.tryParse(qtyCtrl.text.trim()) ?? product.availQuantity,
      'category': selectedCategory,
      'image': payloadImage,
      'images': payloadImage.isNotEmpty ? [payloadImage] : [],
      'artisanId': product.artisanId,
      'artisan_id': product.artisanId,
    };

    try {
      final res =
          await ApiService.put('/market-items?id=${product.id}', body: payload);
      if (res['ok'] == true) {
        await _loadMyProducts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Product updated successfully'),
                backgroundColor: AppColors.success),
          );
        }
      } else {
        throw Exception(res['message'] ?? 'Failed to update product');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('My Products',
            style: TextStyle(fontWeight: FontWeight.w700)),
        centerTitle: false,
        actions: [
          IconButton(
            onPressed: () async {
              await Navigator.pushNamed(context, '/add-product');
              _loadMyProducts();
            },
            icon: const Icon(Icons.add_box_outlined),
          ),
          IconButton(
            onPressed: () {
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const ArtisanRequestsScreen()));
            },
            icon: const Icon(Icons.forum_outlined),
            tooltip: 'Requests',
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
                      Text(_error!,
                          style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                          onPressed: _loadMyProducts,
                          child: const Text('Retry'))
                    ],
                  ),
                )
              : _myProducts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined,
                              size: 64,
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withValues(alpha: 0.2)),
                          const SizedBox(height: 16),
                          Text('You have no products listed.',
                              style: TextStyle(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withValues(alpha: 0.6))),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadMyProducts,
                      child: ListView.builder(
                        padding: const EdgeInsets.only(
                            top: 16, bottom: 100, left: 16, right: 16),
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
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
            child: SizedBox(
              width: 120,
              height: 120,
              child: CustomImage(imageUrl: product.image, fit: BoxFit.cover),
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
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 16,
                        fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${product.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 14,
                        fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Stock: ${product.availQuantity}',
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.edit_outlined,
                            size: 20, color: AppColors.textMuted),
                        onPressed: () => _editProduct(product),
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
}
