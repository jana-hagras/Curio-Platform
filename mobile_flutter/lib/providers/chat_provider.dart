import 'package:flutter/material.dart';
import '../models/chat_message_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class ChatProvider extends ChangeNotifier {
  List<ChatMessageModel> _messages = [];

  List<ChatMessageModel> get messages => _messages;

  ChatProvider() {
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    final data = LocalStorageService.loadList(StorageKeys.chatMessages);
    _messages = data.map((j) => ChatMessageModel.fromJson(j)).toList();
    notifyListeners();
  }

  Future<void> _saveMessages() async {
    final data = _messages.map((m) => m.toJson()).toList();
    await LocalStorageService.saveList(StorageKeys.chatMessages, data);
  }

  /// Send a new message.
  Future<void> sendMessage({
    required int senderId,
    required int receiverId,
    required String message,
  }) async {
    final now = DateTime.now();
    final newMsg = ChatMessageModel(
      id: now.millisecondsSinceEpoch.toString(),
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      timestamp: now.toIso8601String(),
      isMe: true,
      isRead: false,
    );

    _messages.add(newMsg);
    await _saveMessages();
    notifyListeners();

    // Simulate a reply after 1 second
    Future.delayed(const Duration(seconds: 1), () {
      final reply = ChatMessageModel(
        id: (now.millisecondsSinceEpoch + 1000).toString(),
        senderId: receiverId,
        receiverId: senderId,
        message: _getAutoReply(),
        timestamp: DateTime.now().toIso8601String(),
        isMe: false,
        isRead: false,
      );
      _messages.add(reply);
      _saveMessages();
      notifyListeners();
    });
  }

  String _getAutoReply() {
    final replies = [
      'Thank you for your message! I\'ll get back to you shortly.',
      'That sounds wonderful! Let me prepare some options for you.',
      'I appreciate your interest in my work!',
      'I can definitely create something special for you.',
      'Great choice! Shall I customize it further?',
    ];
    return replies[DateTime.now().second % replies.length];
  }

  /// Get messages between two users.
  List<ChatMessageModel> getConversation(int userId1, int userId2) {
    final messages = _messages
        .where((m) =>
            (m.senderId == userId1 && m.receiverId == userId2) ||
            (m.senderId == userId2 && m.receiverId == userId1))
        .map((m) => m.copyWith(isMe: m.senderId == userId1))
        .toList();
    messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return messages;
  }

  int unreadCountForPeer(int userId, int peerId) {
    return _messages
        .where(
            (m) => m.senderId == peerId && m.receiverId == userId && !m.isRead)
        .length;
  }

  int totalUnreadForUser(int userId) {
    return _messages.where((m) => m.receiverId == userId && !m.isRead).length;
  }

  Future<void> markConversationRead(int userId, int peerId) async {
    var changed = false;
    _messages = _messages.map((m) {
      if (m.senderId == peerId && m.receiverId == userId && !m.isRead) {
        changed = true;
        return m.copyWith(isRead: true);
      }
      return m;
    }).toList();

    if (changed) {
      await _saveMessages();
      notifyListeners();
    }
  }

  List<ConversationSummary> getConversationSummaries(
    int userId,
    List<Map<String, dynamic>> users,
  ) {
    final byPeer = <int, List<ChatMessageModel>>{};
    for (final message in _messages) {
      if (message.senderId != userId && message.receiverId != userId) {
        continue;
      }
      final peerId =
          message.senderId == userId ? message.receiverId : message.senderId;
      byPeer.putIfAbsent(peerId, () => []).add(message);
    }

    final summaries = byPeer.entries.map((entry) {
      final messages = entry.value
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
      final peer = users.cast<Map<String, dynamic>?>().firstWhere(
            (user) => user?['id'] == entry.key,
            orElse: () => null,
          );
      final name = peer == null
          ? 'User ${entry.key}'
          : '${peer['firstName'] ?? ''} ${peer['lastName'] ?? ''}'.trim();
      final fallbackName = peer?['email']?.toString() ?? 'User ${entry.key}';
      return ConversationSummary(
        peerId: entry.key,
        peerName: name.isEmpty ? fallbackName : name,
        peerType: peer?['type']?.toString() ?? 'User',
        lastMessage: messages.last.copyWith(isMe: messages.last.senderId == userId),
        unreadCount: unreadCountForPeer(userId, entry.key),
      );
    }).toList();

    summaries.sort(
        (a, b) => b.lastMessage.timestamp.compareTo(a.lastMessage.timestamp));
    return summaries;
  }
}

class ConversationSummary {
  final int peerId;
  final String peerName;
  final String peerType;
  final ChatMessageModel lastMessage;
  final int unreadCount;

  const ConversationSummary({
    required this.peerId,
    required this.peerName,
    required this.peerType,
    required this.lastMessage,
    required this.unreadCount,
  });
}
