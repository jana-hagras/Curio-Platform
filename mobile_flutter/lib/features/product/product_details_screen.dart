import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/custom_image.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorite_provider.dart';
import '../../models/market_item_model.dart';
import '../../models/cart_item_model.dart';

/// Product detail screen matching frontend ProductDetailPage design.
class ProductDetailsScreen extends StatelessWidget {
  const ProductDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final item = ModalRoute.of(context)?.settings.arguments as MarketItemModel?;

    final title = item?.item ?? 'Handmade Clay Vase';
    final price = item != null ? 'EGP ${item.price.toStringAsFixed(0)}' : 'EGP 450';
    final description = item?.description ??
        'This exquisite handmade clay vase is a testament to traditional Egyptian craftsmanship.';
    final artisanName = item?.artisanName ?? 'Youssef El Sayed';
    final category = item?.category ?? 'Pottery';
    final image = item?.image;
    final productId = item?.id ?? 0;

    final surfaceColor = isDark ? AppColors.surface : AppColors.surfaceLight;
    final bgColor = isDark ? AppColors.background : AppColors.backgroundLight;
    final textColor = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.divider : AppColors.borderLight;
    final chipBg = isDark ? AppColors.surfaceElevated : AppColors.surfaceTertiaryLight;

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            backgroundColor: AppColors.dark,
            flexibleSpace: FlexibleSpaceBar(
              background: CustomImage(imageUrl: image, fit: BoxFit.cover),
            ),
            actions: [
              Consumer<FavoriteProvider>(
                builder: (ctx, favProvider, _) {
                  final isFav = favProvider.isFavorite(productId.toString());
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: IconButton(
                      onPressed: () => favProvider.toggleFavorite(productId.toString()),
                      icon: Icon(
                        isFav ? Icons.favorite : Icons.favorite_border,
                        color: isFav ? AppColors.error : Colors.white,
                      ),
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.dark.withValues(alpha: 0.5),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title — Playfair Display like frontend
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Playfair Display',
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Price — gold, bold like frontend .product-card-price
                  Text(
                    price,
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Artisan row — card container like frontend
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceElevated : AppColors.surfaceTertiaryLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.gold.withValues(alpha: 0.1),
                          child: const Icon(Icons.person, color: AppColors.gold, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(artisanName, style: TextStyle(
                                fontWeight: FontWeight.w600, color: textColor)),
                              Text("Master Potter · Cairo", style: TextStyle(
                                fontSize: 12, color: secondaryText)),
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
                  Text("About This Piece", style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700, color: textColor)),
                  const SizedBox(height: 10),
                  Text(
                    description,
                    style: TextStyle(color: secondaryText, height: 1.7, fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  // Tags — styled like frontend category chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [category, "Ancient Egyptian", "Handmade", "Home Decor"]
                        .map((t) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: chipBg,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: borderColor),
                              ),
                              child: Text(t, style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: textColor,
                              )),
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
      // Bottom action bar
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        decoration: BoxDecoration(
          color: surfaceColor,
          border: Border(top: BorderSide(color: borderColor)),
          boxShadow: [BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          )],
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
                          const SnackBar(
                            content: Text("Added to cart!"),
                            backgroundColor: AppColors.success,
                            duration: Duration(seconds: 1),
                          ),
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
