import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../models/proposal_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/proposals_provider.dart';

class BuyerProposalsScreen extends StatelessWidget {
  const BuyerProposalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('Custom Proposals')),
      body: user == null
          ? const Center(child: Text('Please login to view proposals'))
          : Consumer<ProposalsProvider>(
              builder: (context, provider, _) {
                final proposals = provider.forBuyer(user.id);
                if (proposals.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.request_quote_outlined,
                            size: 56, color: AppColors.textSecondary),
                        SizedBox(height: 12),
                        Text('No proposals yet',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text('Create a custom request to receive offers',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: proposals.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final proposal = proposals[index];
                    return _ProposalCard(proposal: proposal);
                  },
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/custom-order'),
        icon: const Icon(Icons.add),
        label: const Text('Request'),
      ),
    );
  }
}

class _ProposalCard extends StatelessWidget {
  final ProposalModel proposal;

  const _ProposalCard({required this.proposal});

  @override
  Widget build(BuildContext context) {
    final request = _findById(StorageKeys.customOrders, proposal.customOrderId);
    final artisan = _findById(StorageKeys.users, proposal.artisanId);
    final statusColor = _statusColor(proposal.status);
    final canRespond = proposal.status == 'Sent';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request['category']?.toString() ?? 'Custom request',
                  style: const TextStyle(
                      fontWeight: FontWeight.w800, fontSize: 16),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(proposal.status,
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'From ${_displayName(artisan)}',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Text(proposal.message),
          const SizedBox(height: 12),
          Row(
            children: [
              _MetaChip(
                  icon: Icons.payments_outlined,
                  label: '\$ ${proposal.price.toStringAsFixed(0)}'),
              const SizedBox(width: 8),
              _MetaChip(
                  icon: Icons.schedule_outlined, label: proposal.timeline),
            ],
          ),
          if (canRespond) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _reject(context),
                    icon: const Icon(Icons.close),
                    label: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _accept(context),
                    icon: const Icon(Icons.check),
                    label: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _accept(BuildContext context) async {
    final proposals = context.read<ProposalsProvider>();
    final orders = context.read<OrderProvider>();
    await proposals.acceptProposal(proposal);
    await orders.loadOrders();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Proposal accepted. A processing order was created.'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  Future<void> _reject(BuildContext context) async {
    await context.read<ProposalsProvider>().rejectProposal(proposal.id);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Proposal rejected'),
        backgroundColor: AppColors.warning,
      ),
    );
  }

  Map<String, dynamic> _findById(String key, int id) {
    final list = LocalStorageService.loadList(key);
    return list.cast<Map<String, dynamic>?>().firstWhere(
              (item) => item?['id'] == id,
              orElse: () => null,
            ) ??
        {};
  }

  String _displayName(Map<String, dynamic> user) {
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    return name.isEmpty ? user['email']?.toString() ?? 'Artisan' : name;
  }

  Color _statusColor(String status) {
    return switch (status) {
      'Accepted' => AppColors.success,
      'Rejected' => AppColors.error,
      _ => AppColors.warning,
    };
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: AppColors.primary),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
