import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/favorite_provider.dart';
import '../../models/market_item_model.dart';
import 'custom_image.dart';

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
    final favProvider = Provider.of<FavoriteProvider>(context);
    final isFav = favProvider.isFavorite(item.id.toString());

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color ??
              Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).dividerColor),
          boxShadow: Theme.of(context).cardTheme.shadowColor != null
              ? [
                  BoxShadow(
                    color: Theme.of(context).cardTheme.shadowColor!,
                    blurRadius: 6,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: CustomImage(
                      imageUrl: item.image,
                      borderRadius: 12,
                      fit: BoxFit.cover,
                    ),
                  ),
                  // Favorite button
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () =>
                          favProvider.toggleFavorite(item.id.toString()),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.dark.withValues(alpha: 0.5),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isFav ? Icons.favorite : Icons.favorite_border,
                          color:
                              isFav ? AppColors.error : AppColors.textSecondary,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Details section
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.item,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "\$ ${item.price.toStringAsFixed(0)}",
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      if (item.category != null)
                        Text(
                          item.category!,
                          style: TextStyle(
                            color:
                                AppColors.textSecondary.withValues(alpha: 0.6),
                            fontSize: 10,
                          ),
                        ),
                    ],
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
