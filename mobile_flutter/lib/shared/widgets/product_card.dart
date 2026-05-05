import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/favorite_provider.dart';
import '../../models/market_item_model.dart';
import 'custom_image.dart';

/// Product card matching frontend ProductCard.jsx + ProductCard.css design.
class ProductCard extends StatelessWidget {
  final MarketItemModel item;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final favProvider = Provider.of<FavoriteProvider>(context);
    final isFav = favProvider.isFavorite(item.id.toString());
    final surfaceColor = isDark ? AppColors.surface : AppColors.surfaceLight;
    final borderColor = isDark ? AppColors.divider : AppColors.borderLight;
    final textColor = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(16), // --radius-lg
          border: Border.all(color: borderColor),
          // Matches frontend .product-card shadow
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06),
              blurRadius: isDark ? 8 : 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image section — matches .product-card-image (220px) ──
            Expanded(
              child: Stack(
                children: [
                  // Product image with rounded top corners
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                      child: CustomImage(
                        imageUrl: item.image,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  // Category badge — matches .product-card-category
                  if (item.category != null)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.dark,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          item.category!.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  // Favorite button — matches .product-card-fav-btn
                  Positioned(
                    top: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: () => favProvider.toggleFavorite(item.id.toString()),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: isFav
                              ? AppColors.error.withValues(alpha: 0.12)
                              : (isDark
                                  ? AppColors.dark.withValues(alpha: 0.6)
                                  : Colors.white.withValues(alpha: 0.9)),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          color: isFav ? AppColors.error : secondaryText,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // ── Details section — matches .product-card-body ────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product name
                  Text(
                    item.item,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: textColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  // Artisan name — matches .product-card-artisan
                  if (item.artisanName != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.person_outline, size: 13, color: secondaryText),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.artisanName!,
                            style: TextStyle(
                              color: secondaryText,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),
                  // Price — matches .product-card-price (gold, bold)
                  Text(
                    "EGP ${item.price.toStringAsFixed(0)}",
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
