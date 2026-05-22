class ProposalModel {
  final int id;
  final int customOrderId;
  final int artisanId;
  final int buyerId;
  final double price;
  final String timeline;
  final String message;
  final String status; // Sent, Accepted, Rejected
  final String timestamp;

  ProposalModel({
    required this.id,
    required this.customOrderId,
    required this.artisanId,
    required this.buyerId,
    required this.price,
    required this.timeline,
    required this.message,
    required this.status,
    required this.timestamp,
  });

  factory ProposalModel.fromJson(Map<String, dynamic> json) {
    return ProposalModel(
      id: json['id'] ?? 0,
      customOrderId: json['customOrderId'] ?? json['requestId'] ?? 0,
      artisanId: json['artisanId'] ?? 0,
      buyerId: json['buyerId'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      timeline: json['timeline'] ?? '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'Sent',
      timestamp: json['timestamp'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customOrderId': customOrderId,
      'artisanId': artisanId,
      'buyerId': buyerId,
      'price': price,
      'timeline': timeline,
      'message': message,
      'status': status,
      'timestamp': timestamp,
    };
  }
}
