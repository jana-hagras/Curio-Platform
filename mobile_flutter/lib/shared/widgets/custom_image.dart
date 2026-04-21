import 'dart:io';
import 'package:flutter/material.dart';
import 'card_shimmer.dart';

/// A custom image widget that handles asset images, file images, and placeholders.
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
      return _buildPlaceholder();
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
          errorBuilder: (ctx, error, stack) => _buildPlaceholder(),
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
            errorBuilder: (ctx, error, stack) => _buildPlaceholder(),
          ),
        );
      }
      return _buildPlaceholder();
    }

    // Fallback placeholder
    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.image_outlined,
              color: Colors.grey[400],
              size: 36,
            ),
            const SizedBox(height: 4),
            Text(
              'No Image',
              style: TextStyle(
                color: Colors.grey[400],
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
