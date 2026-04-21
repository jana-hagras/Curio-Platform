import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorite_provider.dart';
import '../../models/market_item_model.dart';
import '../../models/cart_item_model.dart';

class ProductDetailsScreen extends StatelessWidget {
  const ProductDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final item = ModalRoute.of(context)?.settings.arguments as MarketItemModel?;

    // Fallback if no arguments passed
    final title = item?.item ?? 'Handmade Clay Vase';
    final price = item != null ? 'EGP ${item.price.toStringAsFixed(0)}' : 'EGP 450';
    final description = item?.description ??
        'This exquisite handmade clay vase is a testament to traditional Egyptian craftsmanship.';
    final artisanName = item?.artisanName ?? 'Youssef El Sayed';
    final category = item?.category ?? 'Pottery';
    final image = item?.image;
    final productId = item?.id ?? 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            backgroundColor: AppColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: CustomImage(imageUrl: image, fit: BoxFit.cover),
            ),
            actions: [
              Consumer<FavoriteProvider>(
                builder: (ctx, favProvider, _) {
                  final isFav = favProvider.isFavorite(productId.toString());
                  return IconButton(
                    onPressed: () => favProvider.toggleFavorite(productId.toString()),
                    icon: Icon(isFav ? Icons.favorite : Icons.favorite_border, color: isFav ? Colors.red : null),
                    style: IconButton.styleFrom(backgroundColor: Colors.white70),
                  );
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + Price
                  Text(
                    title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, fontFamily: 'Playfair'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    price,
                    style: const TextStyle(color: AppColors.primary, fontSize: 22, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 20),

                  // Artisan row
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.primary.withOpacity(0.15),
                          child: const Icon(Icons.person, color: AppColors.primary, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(artisanName, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text("Master Potter · Cairo", style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        OutlinedButton(
                          onPressed: () => Navigator.pushNamed(context, '/chat'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(80, 36),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text("Chat", style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Description
                  const Text("About This Piece", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Text(
                    description,
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.7, fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  // Tags
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [category, "Ancient Egyptian", "Handmade", "Home Decor"]
                        .map((t) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, -4))],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/custom-order'),
                style: OutlinedButton.styleFrom(minimumSize: const Size(0, 52)),
                child: const Text("Custom Request"),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Consumer<CartProvider>(
                builder: (ctx, cartProvider, _) {
                  final inCart = cartProvider.isInCart(productId);
                  return ElevatedButton(
                    onPressed: () {
                      if (item == null) return;
                      if (inCart) {
                        Navigator.pushNamed(context, '/cart');
                      } else {
                        cartProvider.addToCart(CartItemModel(
                          productId: item.id,
                          name: item.item,
                          price: item.price,
                          image: item.image,
                        ));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Added to cart!"), backgroundColor: AppColors.success, duration: Duration(seconds: 1)),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(minimumSize: const Size(0, 52)),
                    child: Text(inCart ? "View Cart" : "Add to Cart"),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
