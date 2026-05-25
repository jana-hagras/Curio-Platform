import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/chat_provider.dart';
import '../../providers/auth_provider.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollController = ScrollController();
  int? _markedPeerId;

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final int? peerId =
        args != null && args['peerId'] != null ? (args['peerId'] as int) : null;
    final int? peerId2 =
        args != null && args['peerId2'] != null ? (args['peerId2'] as int) : null;
    final String peerName = args != null && args['peerName'] != null
        ? args['peerName'] as String
        : 'Chat';
    final bool isHelpLine = args?['isHelpLine'] == true;
    final currentUserId =
        Provider.of<AuthProvider>(context, listen: false).user?.id ?? 0;

    if (peerId != null && _markedPeerId != peerId && currentUserId != 0) {
      _markedPeerId = peerId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Provider.of<ChatProvider>(context, listen: false)
            .markConversationRead(currentUserId, peerId);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
                radius: 16,
                backgroundColor: isHelpLine
                    ? AppColors.info.withValues(alpha: 0.15)
                    : AppColors.primary.withValues(alpha: 0.15),
                child: Icon(
                    isHelpLine ? Icons.support_agent : Icons.person,
                    size: 16,
                    color: isHelpLine ? AppColors.info : AppColors.primary)),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(peerName,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600)),
                Text(isHelpLine ? 'Support' : 'Online',
                    style: TextStyle(
                        fontSize: 11,
                        color: isHelpLine
                            ? AppColors.info
                            : AppColors.success)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer2<ChatProvider, AuthProvider>(
              builder: (ctx, chatProvider, auth, _) {
                final userId = auth.user?.id ?? 0;
                if (peerId != null) {
                  final messages = peerId2 != null 
                      ? chatProvider.getConversation(peerId, peerId2)
                      : chatProvider.getConversation(userId, peerId);
                  _scrollToBottom();

                  if (messages.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isHelpLine
                                ? Icons.support_agent
                                : Icons.chat_bubble_outline,
                            size: 48,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            isHelpLine
                                ? 'How can we help you?'
                                : 'Start the conversation',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isHelpLine
                                ? 'Send a message to our support team'
                                : 'Say hello to $peerName!',
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount: messages.length,
                    itemBuilder: (_, i) {
                      final msg = messages[i];
                      final isMe = peerId2 != null ? msg.senderId == peerId : msg.senderId == userId;
                      final timestamp = DateTime.tryParse(msg.timestamp);

                      // Show date separator if needed
                      Widget? dateSeparator;
                      if (i == 0 ||
                          _isDifferentDay(
                              messages[i - 1].timestamp, msg.timestamp)) {
                        dateSeparator = _dateSeparator(timestamp);
                      }

                      return Column(
                        children: [
                          if (dateSeparator != null) dateSeparator,
                          _bubble(
                            text: msg.message,
                            isMe: isMe,
                            timestamp: timestamp,
                            isRead: msg.isRead,
                          ),
                        ],
                      );
                    },
                  );
                }

                return Center(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/inbox'),
                    icon: const Icon(Icons.inbox_outlined),
                    label: const Text('Open inbox'),
                  ),
                );
              },
            ),
          ),
          peerId == null
              ? Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: const Text('Select a conversation to start messaging',
                      style: TextStyle(color: AppColors.textSecondary)),
                )
              : peerId2 != null
                  ? Container(
                      padding: const EdgeInsets.all(16),
                      color: Colors.white,
                      alignment: Alignment.center,
                      child: const Text('View-only mode',
                          style: TextStyle(color: AppColors.textSecondary)),
                    )
                  : Container(
                  padding: const EdgeInsets.fromLTRB(16, 10, 8, 24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, -2))
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(24)),
                          child: TextField(
                            controller: _msgCtrl,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (_) => _sendMessage(peerId),
                            decoration: const InputDecoration(
                                hintText: "Type a message...",
                                border: InputBorder.none,
                                filled: false,
                                contentPadding:
                                    EdgeInsets.symmetric(vertical: 12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        decoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        child: IconButton(
                          onPressed: () => _sendMessage(peerId),
                          icon: const Icon(Icons.send,
                              color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  void _sendMessage(int? peerId) {
    if (_msgCtrl.text.trim().isEmpty || peerId == null) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final userId = auth.user?.id ?? 0;
    Provider.of<ChatProvider>(context, listen: false).sendMessage(
      senderId: userId,
      receiverId: peerId,
      message: _msgCtrl.text.trim(),
    );
    _msgCtrl.clear();
    _scrollToBottom();
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  bool _isDifferentDay(String ts1, String ts2) {
    final d1 = DateTime.tryParse(ts1);
    final d2 = DateTime.tryParse(ts2);
    if (d1 == null || d2 == null) return false;
    return d1.year != d2.year || d1.month != d2.month || d1.day != d2.day;
  }

  Widget _dateSeparator(DateTime? date) {
    String label = 'Unknown';
    if (date != null) {
      final now = DateTime.now();
      if (date.year == now.year &&
          date.month == now.month &&
          date.day == now.day) {
        label = 'Today';
      } else if (date.year == now.year &&
          date.month == now.month &&
          date.day == now.day - 1) {
        label = 'Yesterday';
      } else {
        label = '${date.day}/${date.month}/${date.year}';
      }
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          const Expanded(child: Divider(color: AppColors.divider)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ),
          const Expanded(child: Divider(color: AppColors.divider)),
        ],
      ),
    );
  }

  Widget _bubble({
    required String text,
    required bool isMe,
    DateTime? timestamp,
    bool isRead = false,
  }) {
    final timeStr = timestamp != null
        ? '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}'
        : '';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          boxShadow: [
            if (!isMe)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(text,
                style: TextStyle(
                    color: isMe ? Colors.white : AppColors.textPrimary,
                    fontSize: 14,
                    height: 1.4)),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(timeStr,
                    style: TextStyle(
                        fontSize: 10,
                        color: isMe
                            ? Colors.white.withValues(alpha: 0.7)
                            : AppColors.textSecondary)),
                if (isMe) ...[
                  const SizedBox(width: 3),
                  Icon(
                    isRead ? Icons.done_all : Icons.done,
                    size: 13,
                    color: isRead
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.6),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
