class OrderModel {
  final int id;
  final String orderId;
  final int buyerId;
  final String? orderDate;
  final String? deliveryAddress;
  final String status;
  final String? buyerName;
  final int? artisanId;
  final double totalAmount;
  final int? proposalId;
  final List<Map<String, dynamic>> items;

  OrderModel({
    required this.id,
    required this.orderId,
    required this.buyerId,
    this.orderDate,
    this.deliveryAddress,
    required this.status,
    this.buyerName,
    this.artisanId,
    this.totalAmount = 0,
    this.proposalId,
    this.items = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? 0,
      orderId: json['orderId'] ?? 'ORD-0000',
      buyerId: json['buyerId'] ?? 0,
      orderDate: json['orderDate'],
      deliveryAddress: json['deliveryAddress'],
      status: json['status'] ?? 'Pending',
      buyerName: json['buyerName'],
      artisanId: json['artisanId'],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      proposalId: json['proposalId'],
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'buyerId': buyerId,
      'orderDate': orderDate,
      'deliveryAddress': deliveryAddress,
      'status': status,
      'buyerName': buyerName,
      'artisanId': artisanId,
      'totalAmount': totalAmount,
      'proposalId': proposalId,
      'items': items,
    };
  }
}
