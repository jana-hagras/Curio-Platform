import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'card_shimmer.dart';

/// A custom image widget that handles asset images, file images, and placeholders.
/// Placeholder colors are theme-aware to match frontend design system.
class CustomImage extends StatelessWidget {
  final String? imageUrl;
  final double? height;
  final double? width;
  final BoxFit fit;
  final double borderRadius;

  const CustomImage({
    super.key,
    this.imageUrl,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
    this.borderRadius = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _buildPlaceholder(context);
    }

    // Check if it's an asset image
    if (imageUrl!.startsWith('assets/')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Image.asset(
          imageUrl!,
          height: height,
          width: width,
          fit: fit,
          errorBuilder: (ctx, error, stack) => _buildPlaceholder(ctx),
        ),
      );
    }

    // Check if it's a network image
    if (imageUrl!.startsWith('http')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Image.network(
          imageUrl!,
          height: height,
          width: width,
          fit: fit,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return shimmer(height: height, width: width, borderRadius: borderRadius);
          },
          errorBuilder: (ctx, error, stack) => _buildPlaceholder(ctx),
        ),
      );
    }

    // Check if it's a local file path
    if (imageUrl!.startsWith('/') || imageUrl!.contains('\\')) {
      final file = File(imageUrl!);
      if (file.existsSync()) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: Image.file(
            file,
            height: height,
            width: width,
            fit: fit,
            errorBuilder: (ctx, error, stack) => _buildPlaceholder(ctx),
          ),
        );
      }
      return _buildPlaceholder(context);
    }

    // Fallback placeholder
    return _buildPlaceholder(context);
  }

  Widget _buildPlaceholder(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.surfaceElevated : AppColors.surfaceTertiaryLight;
    final iconColor = isDark ? AppColors.textMuted : AppColors.textTertiaryLight;

    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.image_outlined,
              color: iconColor,
              size: 36,
            ),
            const SizedBox(height: 4),
            Text(
              'No Image',
              style: TextStyle(
                color: iconColor,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build a shimmer loading version of this image widget.
  static Widget shimmer({double? height, double? width, double borderRadius = 0}) {
    return CardShimmer(
      height: height ?? 200,
      width: width ?? double.infinity,
      borderRadius: borderRadius,
    );
  }
}
