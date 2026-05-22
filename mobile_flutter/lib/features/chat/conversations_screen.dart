import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../shared/widgets/app_drawer.dart';

class ConversationsScreen extends StatelessWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final isArtisan = user?.isArtisan ?? false;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(title: const Text('Messages')),
      floatingActionButton: (!isArtisan && user != null)
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.pushNamed(context, '/artisan-directory'),
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.chat_bubble_outline, color: Colors.white),
              label: const Text('Start New Chat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: user == null
          ? const Center(child: Text('Please login to view messages'))
          : Consumer<ChatProvider>(
              builder: (context, chat, _) {
                final users = LocalStorageService.loadList(StorageKeys.users);
                final summaries = chat.getConversationSummaries(user.id, users);

                if (summaries.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.forum_outlined, size: 56, color: AppColors.textSecondary),
                        const SizedBox(height: 12),
                        const Text('No conversations yet', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                        const SizedBox(height: 4),
                        Text(isArtisan ? 'Messages from buyers will appear here' : 'Start chatting with an artisan',
                            style: const TextStyle(color: AppColors.textSecondary)),
                        if (!isArtisan) ...[
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => Navigator.pushNamed(context, '/artisan-directory'),
                            icon: const Icon(Icons.add),
                            label: const Text('Find an Artisan'),
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                          )
                        ]
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: summaries.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final summary = summaries[index];
                    final timestamp =
                        DateTime.tryParse(summary.lastMessage.timestamp);
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: const BorderSide(color: AppColors.divider),
                      ),
                      leading: CircleAvatar(
                        backgroundColor:
                            AppColors.primary.withValues(alpha: 0.12),
                        child:
                            const Icon(Icons.person, color: AppColors.primary),
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(summary.peerName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                          ),
                          Text(_formatTime(timestamp),
                              style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12)),
                        ],
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(summary.lastMessage.message,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      trailing: summary.unreadCount == 0
                          ? const Icon(Icons.chevron_right,
                              color: AppColors.textSecondary)
                          : CircleAvatar(
                              radius: 12,
                              backgroundColor: AppColors.primary,
                              child: Text('${summary.unreadCount}',
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 11)),
                            ),
                      onTap: () => Navigator.pushNamed(
                        context,
                        '/chat',
                        arguments: {
                          'peerId': summary.peerId,
                          'peerName': summary.peerName,
                        },
                      ),
                    );
                  },
                );
              },
            ),
    );
  }

  String _formatTime(DateTime? value) {
    if (value == null) return '';
    final now = DateTime.now();
    if (value.year == now.year &&
        value.month == now.month &&
        value.day == now.day) {
      return '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
    }
    return '${value.month}/${value.day}';
  }
}
