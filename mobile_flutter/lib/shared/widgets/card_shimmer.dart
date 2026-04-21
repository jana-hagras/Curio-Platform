import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class CardShimmer extends StatelessWidget {
  final double height;
  final double width;
  final double borderRadius;

  const CardShimmer({
    super.key,
    this.height = 200,
    this.width = double.infinity,
    this.borderRadius = 12.0,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  static Widget list({int count = 5}) {
    return ListView.builder(
      itemCount: count,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.all(8.0),
        child: const CardShimmer(),
      ),
    );
  }
}
