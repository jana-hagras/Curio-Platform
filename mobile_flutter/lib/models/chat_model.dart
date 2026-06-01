import 'chat_message_model.dart';

/// Represents a chat conversation between two users.
class ChatModel {
  final String id;
  final int participant1;
  final int participant2;
  final ChatMessageModel? lastMessage;
  final int unreadCount;
  final String createdAt;

  const ChatModel({
    required this.id,
    required this.participant1,
    required this.participant2,
    this.lastMessage,
    this.unreadCount = 0,
    required this.createdAt,
  });

  /// Build a canonical chat id from two user IDs.
  static String buildId(int userId1, int userId2) {
    final smaller = userId1 < userId2 ? userId1 : userId2;
    final larger = userId1 < userId2 ? userId2 : userId1;
    return 'chat_${smaller}_$larger';
  }

  /// Check if a user is a participant.
  bool hasParticipant(int userId) =>
      participant1 == userId || participant2 == userId;

  /// Get the other participant's ID.
  int otherParticipant(int userId) =>
      participant1 == userId ? participant2 : participant1;

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['id'] ?? '',
      participant1: json['participant1'] ?? 0,
      participant2: json['participant2'] ?? 0,
      lastMessage: json['lastMessage'] != null
          ? ChatMessageModel.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      createdAt: json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participant1': participant1,
      'participant2': participant2,
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'createdAt': createdAt,
    };
  }
}
