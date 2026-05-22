import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/proposals_provider.dart';
import '../../core/theme/app_colors.dart';

class ArtisanRequestsScreen extends StatefulWidget {
  const ArtisanRequestsScreen({super.key});

  @override
  State<ArtisanRequestsScreen> createState() => _ArtisanRequestsScreenState();
}

class _ArtisanRequestsScreenState extends State<ArtisanRequestsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _requests = [];
  List<Map<String, dynamic>> _filteredRequests = [];
  List<Map<String, dynamic>> _proposals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final allRequests = LocalStorageService.loadList(StorageKeys.customOrders);
    final proposals =
        Provider.of<ProposalsProvider>(context, listen: false).forArtisan(
      user?.id ?? 0,
    );
    setState(() {
      _requests = allRequests.where((r) => r['artisanId'] == user?.id).toList();
      _filteredRequests = List.from(_requests);
      _proposals = proposals.map((proposal) => proposal.toJson()).toList();
      _loading = false;
    });
  }

  Future<void> _sendProposal(Map<String, dynamic> request) async {
    final priceCtrl =
        TextEditingController(text: request['budget']?.toString());
    final timelineCtrl = TextEditingController(text: '2 weeks');
    final messageCtrl = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Send Proposal'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Price (USD)'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: timelineCtrl,
                decoration: const InputDecoration(labelText: 'Timeline'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: messageCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Message'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Send')),
        ],
      ),
    );

    if (saved != true || !mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final buyerId = request['buyerId'] as int? ?? 0;
    final newProposal =
        await Provider.of<ProposalsProvider>(context, listen: false)
            .createProposal(
      customOrderId: request['id'] as int? ?? 0,
      artisanId: user?.id ?? 0,
      buyerId: buyerId,
      price: double.tryParse(priceCtrl.text.trim()) ?? 0.0,
      timeline: timelineCtrl.text.trim(),
      message: messageCtrl.text.trim(),
    );
    if (!mounted) return;

    // Also send a chat message to buyer so they see the proposal in messages
    Provider.of<ChatProvider>(context, listen: false).sendMessage(
      senderId: user?.id ?? 0,
      receiverId: buyerId,
      message:
          'Proposal: \$ ${newProposal.price} · ${newProposal.timeline}\n${newProposal.message}',
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('Proposal sent'), backgroundColor: AppColors.success),
    );

    await _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Requests & Proposals'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Requests'), Tab(text: 'Sent')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRequestsTab(),
                _buildSentTab(),
              ],
            ),
    );
  }

  Widget _buildRequestsTab() {
    if (_requests.isEmpty) {
      return const Center(child: Text('No requests assigned to you'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _filteredRequests.length,
        itemBuilder: (_, i) {
          final r = _filteredRequests[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r['category'] ?? 'Request',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(r['description'] ?? ''),
                  const SizedBox(height: 8),
                  Row(children: [
                    Text('Budget: \$ ${r['budget'] ?? 0}'),
                    const SizedBox(width: 12),
                    Text('Deadline: ${r['deadline'] ?? '-'}'),
                  ]),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ElevatedButton(
                          onPressed: () => _sendProposal(r),
                          child: const Text('Send Proposal')),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () =>
                            _openConversation(r['buyerId'] as int? ?? 0),
                        child: const Text('Open Chat'),
                      ),
                    ],
                  )
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSentTab() {
    if (_proposals.isEmpty) {
      return const Center(child: Text('No proposals sent yet'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _proposals.length,
        itemBuilder: (_, i) {
          final p = _proposals[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text('\$ ${p['price']} · ${p['timeline']}'),
              subtitle: Text(p['message'] ?? ''),
              trailing: Text(p['status'] ?? 'Sent'),
              onTap: () => _openConversation(p['buyerId'] as int? ?? 0),
            ),
          );
        },
      ),
    );
  }

  void _openConversation(int buyerId) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final userId = auth.user?.id ?? 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ConversationSheet(artisanId: userId, buyerId: buyerId),
      ),
    );
  }
}

class ConversationSheet extends StatefulWidget {
  final int artisanId;
  final int buyerId;
  const ConversationSheet(
      {required this.artisanId, required this.buyerId, super.key});

  @override
  State<ConversationSheet> createState() => _ConversationSheetState();
}

class _ConversationSheetState extends State<ConversationSheet> {
  final _ctrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.7,
      child: Column(
        children: [
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (ctx, chat, _) {
                final conv =
                    chat.getConversation(widget.artisanId, widget.buyerId);
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: conv.length,
                  itemBuilder: (_, i) {
                    final m = conv[i];
                    final isMe = m.senderId == widget.artisanId;
                    return Align(
                      alignment:
                          isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isMe ? AppColors.primary : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(m.message,
                            style: TextStyle(
                                color: isMe
                                    ? Colors.white
                                    : AppColors.textPrimary)),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration:
                        const InputDecoration(hintText: 'Type a message...'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    final txt = _ctrl.text.trim();
                    if (txt.isEmpty) return;
                    Provider.of<ChatProvider>(context, listen: false)
                        .sendMessage(
                      senderId: widget.artisanId,
                      receiverId: widget.buyerId,
                      message: txt,
                    );
                    _ctrl.clear();
                  },
                  child: const Text('Send'),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
