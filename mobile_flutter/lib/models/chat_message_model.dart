class ChatMessageModel {
  final String id;
  final int senderId;
  final int receiverId;
  final String message;
  final String timestamp;
  final bool isMe;
  final bool isRead;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.timestamp,
    required this.isMe,
    this.isRead = false,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id']?.toString() ?? '',
      senderId: json['senderId'] ?? 0,
      receiverId: json['receiverId'] ?? 0,
      message: json['message'] ?? '',
      timestamp: json['timestamp'] ?? '',
      isMe: json['isMe'] ?? false,
      isRead: json['isRead'] ?? false,
    );
  }

  ChatMessageModel copyWith({
    String? id,
    int? senderId,
    int? receiverId,
    String? message,
    String? timestamp,
    bool? isMe,
    bool? isRead,
  }) {
    return ChatMessageModel(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isMe: isMe ?? this.isMe,
      isRead: isRead ?? this.isRead,
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
      'isRead': isRead,
    };
  }
}
