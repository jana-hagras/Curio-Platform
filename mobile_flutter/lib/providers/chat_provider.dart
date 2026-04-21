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
    return _messages.where((m) =>
        (m.senderId == userId1 && m.receiverId == userId2) ||
        (m.senderId == userId2 && m.receiverId == userId1)
    ).toList();
  }
}
