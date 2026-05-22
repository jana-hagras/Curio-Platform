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
  int? _markedPeerId;

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final int? peerId =
        args != null && args['peerId'] != null ? (args['peerId'] as int) : null;
    final String peerName = args != null && args['peerName'] != null
        ? args['peerName'] as String
        : 'Chat';
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
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: const Icon(Icons.person,
                    size: 16, color: AppColors.primary)),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(peerName,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600)),
                const Text("Online",
                    style: TextStyle(fontSize: 11, color: AppColors.success)),
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
                // If a peerId was provided, show the one-to-one conversation
                if (peerId != null) {
                  final messages = chatProvider.getConversation(userId, peerId);
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (_, i) {
                      final msg = messages[i];
                      final isMe = msg.senderId == userId;
                      return _bubble(msg.message, isMe);
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
                          onPressed: () {
                            if (_msgCtrl.text.trim().isEmpty) return;
                            final auth = Provider.of<AuthProvider>(context,
                                listen: false);
                            final userId = auth.user?.id ?? 0;
                            final toId = peerId;
                            Provider.of<ChatProvider>(context, listen: false)
                                .sendMessage(
                              senderId: userId,
                              receiverId: toId,
                              message: _msgCtrl.text.trim(),
                            );
                            _msgCtrl.clear();
                          },
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

  Widget _bubble(String text, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
        ),
        child: Text(text,
            style: TextStyle(
                color: isMe ? Colors.white : AppColors.textPrimary,
                fontSize: 14,
                height: 1.4)),
      ),
    );
  }
}
