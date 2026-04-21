class ChatMessageModel {
  final String id;
  final int senderId;
  final int receiverId;
  final String message;
  final String timestamp;
  final bool isMe;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.timestamp,
    required this.isMe,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id']?.toString() ?? '',
      senderId: json['senderId'] ?? 0,
      receiverId: json['receiverId'] ?? 0,
      message: json['message'] ?? '',
      timestamp: json['timestamp'] ?? '',
      isMe: json['isMe'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'message': message,
      'timestamp': timestamp,
      'isMe': isMe,
    };
  }
}
