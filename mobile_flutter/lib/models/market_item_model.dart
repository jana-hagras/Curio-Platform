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
    return MarketItemModel(
      id: json['id'] ?? 0,
      artisanId: json['artisan_id'] ?? 0,
      item: json['item'] ?? '',
      description: json['description'],
      image: json['image'],
      availQuantity: json['availQuantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
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
