import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/notification_provider.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Notifications"),
        actions: [
          Consumer<NotificationProvider>(
            builder: (ctx, provider, _) {
              if (provider.unreadCount == 0) return const SizedBox();
              return TextButton(
                onPressed: () => provider.markAllAsRead(),
                child: const Text("Mark all read", style: TextStyle(fontSize: 12)),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (ctx, notifProvider, _) {
          final notifications = notifProvider.notifications;
          if (notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 64, color: AppColors.textSecondary),
                  SizedBox(height: 16),
                  Text("No notifications yet", style: TextStyle(fontSize: 18)),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: notifications.length,
            itemBuilder: (_, i) {
              final n = notifications[i];
              final color = _getColor(n.color);
              final icon = _getIcon(n.icon);
              return Dismissible(
                key: Key(n.id),
                direction: DismissDirection.endToStart,
                onDismissed: (_) => notifProvider.dismiss(n.id),
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.delete_outline, color: AppColors.error),
                ),
                child: GestureDetector(
                  onTap: () => notifProvider.markAsRead(n.id),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: !n.isRead ? Colors.white : Colors.white.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                      border: !n.isRead ? Border.all(color: AppColors.primary.withValues(alpha: 0.2)) : null,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                          child: Icon(icon, color: color, size: 20),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text(n.title, style: TextStyle(fontWeight: !n.isRead ? FontWeight.w700 : FontWeight.w500, fontSize: 14))),
                                  Text(n.time, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(n.body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                        if (!n.isRead) ...[
                          const SizedBox(width: 8),
                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _getColor(String colorName) {
    switch (colorName) {
      case 'primary': return AppColors.primary;
      case 'success': return AppColors.success;
      case 'error': return AppColors.error;
      case 'warning': return AppColors.warning;
      case 'info': return AppColors.info;
      case 'purple': return AppColors.accentPurple;
      default: return AppColors.primary;
    }
  }

  IconData _getIcon(String iconName) {
    switch (iconName) {
      case 'local_shipping': return Icons.local_shipping_outlined;
      case 'chat_bubble': return Icons.chat_bubble_outline;
      case 'check_circle': return Icons.check_circle_outline;
      case 'trending_down': return Icons.trending_down;
      case 'auto_awesome': return Icons.auto_awesome;
      case 'notifications': return Icons.notifications_outlined;
      default: return Icons.notifications_outlined;
    }
  }
}
