class CartItemModel {
  final int productId;
  final String name;
  final double price;
  int quantity;
  final String? image;

  CartItemModel({
    required this.productId,
    required this.name,
    required this.price,
    this.quantity = 1,
    this.image,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      productId: json['productId'] ?? 0,
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      image: json['image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'name': name,
      'price': price,
      'quantity': quantity,
      'image': image,
    };
  }

  double get total => price * quantity;
}
