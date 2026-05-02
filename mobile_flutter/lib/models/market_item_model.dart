import 'dart:convert';

class MarketItemModel {
  final int id;
  final int artisanId;
  final String item;
  final String? description;
  final String? image;
  final int availQuantity;
  final double price;
  final String? category;
  final String? dateAdded;
  final String? artisanName;

  MarketItemModel({
    required this.id,
    required this.artisanId,
    required this.item,
    this.description,
    this.image,
    this.availQuantity = 0,
    required this.price,
    this.category,
    this.dateAdded,
    this.artisanName,
  });

  factory MarketItemModel.fromJson(Map<String, dynamic> json) {
    String? parsedImage;
    if (json['image'] != null) {
      if (json['image'] is List && (json['image'] as List).isNotEmpty) {
        parsedImage = json['image'][0].toString();
      } else if (json['image'] is String) {
        final imgStr = json['image'] as String;
        if (imgStr.startsWith('[')) {
          try {
            final List<dynamic> decoded = jsonDecode(imgStr);
            if (decoded.isNotEmpty) parsedImage = decoded[0].toString();
          } catch (_) {
            parsedImage = imgStr;
          }
        } else {
          parsedImage = imgStr;
        }
      }
    }

    return MarketItemModel(
      id: json['id'] ?? 0,
      artisanId: json['artisan_id'] ?? 0,
      item: json['item'] ?? '',
      description: json['description'],
      image: parsedImage,
      availQuantity: json['availQuantity'] ?? 0,
      price: json['price'] != null ? double.tryParse(json['price'].toString()) ?? 0.0 : 0.0,
      category: json['category'],
      dateAdded: json['dateAdded'],
      artisanName: json['artisanName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'artisan_id': artisanId,
      'item': item,
      'description': description,
      'image': image,
      'availQuantity': availQuantity,
      'price': price,
      'category': category,
      'dateAdded': dateAdded,
      'artisanName': artisanName,
    };
  }
}
