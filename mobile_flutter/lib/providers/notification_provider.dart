import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class NotificationProvider extends ChangeNotifier {
  List<NotificationModel> _notifications = [];

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final data = LocalStorageService.loadList(StorageKeys.notifications);
    _notifications = data.map((j) => NotificationModel.fromJson(j)).toList();
    notifyListeners();
  }

  Future<void> _saveNotifications() async {
    final data = _notifications.map((n) => n.toJson()).toList();
    await LocalStorageService.saveList(StorageKeys.notifications, data);
  }

  /// Mark a notification as read.
  Future<void> markAsRead(String id) async {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx >= 0) {
      _notifications[idx].isRead = true;
      await _saveNotifications();
      notifyListeners();
    }
  }

  /// Mark all as read.
  Future<void> markAllAsRead() async {
    for (var n in _notifications) {
      n.isRead = true;
    }
    await _saveNotifications();
    notifyListeners();
  }

  /// Dismiss a notification.
  Future<void> dismiss(String id) async {
    _notifications.removeWhere((n) => n.id == id);
    await _saveNotifications();
    notifyListeners();
  }

  /// Add a new notification (e.g. after placing an order).
  Future<void> addNotification({
    required String title,
    required String body,
    String icon = 'notifications',
    String color = 'primary',
  }) async {
    final now = DateTime.now();
    final notif = NotificationModel(
      id: now.millisecondsSinceEpoch.toString(),
      title: title,
      body: body,
      icon: icon,
      color: color,
      time: 'Just now',
      isRead: false,
    );
    _notifications.insert(0, notif);
    await _saveNotifications();
    notifyListeners();
  }
}
