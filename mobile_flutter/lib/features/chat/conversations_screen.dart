import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../models/chat_message_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../shared/widgets/app_drawer.dart';

class ConversationsScreen extends StatelessWidget {
  const ConversationsScreen({super.key});

  /// The hardcoded admin user id from seed data.
  static const int _adminUserId = 3;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final isArtisan = user?.isArtisan ?? false;
    final isAdmin = user?.isAdmin ?? false;
    final isBuyer = user?.isBuyer ?? false;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(title: const Text('Messages')),
      floatingActionButton: user != null
          ? FloatingActionButton.extended(
              onPressed: () =>
                  Navigator.pushNamed(context, '/artisan-directory'),
              backgroundColor: AppColors.primary,
              icon:
                  const Icon(Icons.chat_bubble_outline, color: Colors.white),
              label: Text(
                isAdmin
                    ? 'Message Anyone'
                    : isArtisan
                        ? 'Message a Buyer'
                        : 'Find an Artisan',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
      body: user == null
          ? const Center(child: Text('Please login to view messages'))
          : Consumer<ChatProvider>(
              builder: (context, chat, _) {
                final users =
                    LocalStorageService.loadList(StorageKeys.users);

                // Admin sees ALL conversations across all users.
                // Regular users see only their own.
                List<ConversationSummary> summaries;
                if (isAdmin) {
                  summaries = _getAdminSummaries(chat, users);
                } else {
                  summaries =
                      chat.getConversationSummaries(user.id, users);
                }

                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // ── Help Line tile (for non-admin users) ────────
                    if (!isAdmin) _buildHelpLineTile(context, chat, user.id),

                    // ── Conversations ──────────────────────────────
                    if (summaries.isEmpty && isAdmin)
                      _emptyState(
                        icon: Icons.admin_panel_settings_outlined,
                        title: 'No conversations yet',
                        subtitle: 'All user conversations will appear here',
                        showAction: false,
                        isArtisan: false,
                        context: context,
                      ),
                    if (summaries.isEmpty && !isAdmin)
                      _emptyState(
                        icon: Icons.forum_outlined,
                        title: 'No conversations yet',
                        subtitle: isArtisan
                            ? 'Messages from buyers will appear here'
                            : 'Start chatting with an artisan',
                        showAction: isBuyer,
                        isArtisan: isArtisan,
                        context: context,
                      ),
                    ...summaries.map((summary) =>
                        _conversationTile(context, summary)),
                  ],
                );
              },
            ),
    );
  }

  // ── Help Line tile ────────────────────────────────────────────────────

  Widget _buildHelpLineTile(
      BuildContext context, ChatProvider chat, int userId) {
    final unread = chat.unreadCountForPeer(userId, _adminUserId);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: AppColors.info.withValues(alpha: 0.3)),
        ),
        tileColor: AppColors.info.withValues(alpha: 0.04),
        leading: CircleAvatar(
          backgroundColor: AppColors.info.withValues(alpha: 0.12),
          child: const Icon(Icons.support_agent, color: AppColors.info),
        ),
        title: const Row(
          children: [
            Expanded(
              child: Text('Help Line',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
            Text('Support',
                style: TextStyle(color: AppColors.info, fontSize: 11)),
          ],
        ),
        subtitle: const Padding(
          padding: EdgeInsets.only(top: 4),
          child: Text('Contact admin support',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        ),
        trailing: unread > 0
            ? CircleAvatar(
                radius: 12,
                backgroundColor: AppColors.info,
                child: Text('$unread',
                    style:
                        const TextStyle(color: Colors.white, fontSize: 11)),
              )
            : const Icon(Icons.chevron_right,
                color: AppColors.textSecondary),
        onTap: () => Navigator.pushNamed(context, '/chat', arguments: {
          'peerId': _adminUserId,
          'peerName': 'Curio Support',
          'isHelpLine': true,
        }),
      ),
    );
  }

  // ── Conversation tile ────────────────────────────────────────────────

  Widget _conversationTile(BuildContext context, ConversationSummary summary) {
    final timestamp = DateTime.tryParse(summary.lastMessage.timestamp);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.divider),
        ),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
          child: Text(
            summary.peerName.isNotEmpty
                ? summary.peerName[0].toUpperCase()
                : '?',
            style: const TextStyle(
                color: AppColors.primary, fontWeight: FontWeight.bold),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(summary.peerName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _roleColor(summary.peerType)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      summary.peerType,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: _roleColor(summary.peerType),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Text(_formatTime(timestamp),
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${summary.lastMessage.isMe ? 'You: ' : ''}${summary.lastMessage.message}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: summary.unreadCount > 0
                  ? FontWeight.w600
                  : FontWeight.normal,
            ),
          ),
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
            'peerId2': summary.peerId2,
            'peerName': summary.peerName,
          },
        ),
      ),
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool showAction,
    required bool isArtisan,
    required BuildContext context,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 80),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 56, color: AppColors.textSecondary),
            const SizedBox(height: 12),
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 18)),
            const SizedBox(height: 4),
            Text(subtitle,
                style: const TextStyle(color: AppColors.textSecondary)),
            if (showAction) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, '/artisan-directory'),
                icon: const Icon(Icons.add),
                label: const Text('Find an Artisan'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Admin: aggregated view of ALL conversations ──────────────────────

  List<ConversationSummary> _getAdminSummaries(
      ChatProvider chat, List<Map<String, dynamic>> users) {
    // Admin sees all conversations, grouped by unique pairs.
    final allMessages = chat.messages;
    final pairMap = <String, List<ChatMessageModel>>{};

    for (final msg in allMessages) {
      final k1 = msg.senderId < msg.receiverId
          ? '${msg.senderId}_${msg.receiverId}'
          : '${msg.receiverId}_${msg.senderId}';
      pairMap.putIfAbsent(k1, () => []).add(msg);
    }

    final summaries = pairMap.entries.map((entry) {
      final msgs = entry.value
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
      final last = msgs.last;

      // Build a combined display name for the pair
      final ids = entry.key.split('_');
      final id1 = int.parse(ids[0]);
      final id2 = int.parse(ids[1]);

      String nameFor(int id) {
        final u = users.cast<Map<String, dynamic>?>().firstWhere(
              (u) => u?['id'] == id,
              orElse: () => null,
            );
        return u == null
            ? 'User $id'
            : '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
      }

      final name1 = nameFor(id1);
      final name2 = nameFor(id2);
      final peerType1 = users
              .cast<Map<String, dynamic>?>()
              .firstWhere((u) => u?['id'] == id1, orElse: () => null)
              ?['type']
              ?.toString() ??
          'User';

      return ConversationSummary(
        peerId: id1, // We store the first user in the pair
        peerId2: id2, // Store the second user
        peerName: '$name1 ↔ $name2',
        peerType: peerType1,
        lastMessage: last.copyWith(isMe: false),
        unreadCount: 0,
      );
    }).toList();

    summaries.sort(
        (a, b) => b.lastMessage.timestamp.compareTo(a.lastMessage.timestamp));
    return summaries;
  }

  // ── Utilities ────────────────────────────────────────────────────────

  Color _roleColor(String type) {
    return switch (type) {
      'Artisan' => AppColors.gold,
      'Admin' => AppColors.info,
      'Buyer' => AppColors.success,
      _ => AppColors.textSecondary,
    };
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
