import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/custom_image.dart';

class CustomOrdersListScreen extends StatefulWidget {
  const CustomOrdersListScreen({super.key});

  @override
  State<CustomOrdersListScreen> createState() => _CustomOrdersListScreenState();
}

class _CustomOrdersListScreenState extends State<CustomOrdersListScreen> {
  List<Map<String, dynamic>> _customOrders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final allOrders = LocalStorageService.loadList(StorageKeys.customOrders);

    if (!mounted) return;

    setState(() {
      if (user?.isArtisan == true) {
        _customOrders = allOrders
            .where((o) => o['artisanId'] == user?.id)
            .toList()
            .reversed
            .toList();
      } else {
        _customOrders = allOrders
            .where((o) => o['buyerId'] == user?.id)
            .toList()
            .reversed
            .toList();
      }
      _loading = false;
    });
  }

  void _openTracker(Map<String, dynamic> order) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => _CustomOrderTrackingScreen(order: order, onStatusChanged: _load)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isArtisan = context.watch<AuthProvider>().user?.isArtisan ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(title: Text(isArtisan ? "Custom Requests Received" : "My Custom Requests")),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _customOrders.isEmpty
              ? Center(
                  child: Text("No custom requests found.",
                      style: TextStyle(color: AppColors.textSecondary)))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _customOrders.length,
                    itemBuilder: (context, index) {
                      final order = _customOrders[index];
                      final hasAiPreview = order['aiPreviewUrl'] != null;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        clipBehavior: Clip.antiAlias,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: AppColors.divider),
                        ),
                        child: InkWell(
                          onTap: () => _openTracker(order),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (hasAiPreview)
                                SizedBox(
                                  height: 140,
                                  width: double.infinity,
                                  child: CustomImage(
                                    imageUrl: order['aiPreviewUrl'],
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          order['category'] ?? 'Custom',
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 16,
                                              color: AppColors.primary),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(order['status']).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            order['status'] ?? 'Pending',
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: _getStatusColor(order['status'])),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      order['description'] ?? '',
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: AppColors.textPrimary, height: 1.4),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          "Budget: \$${order['budget']}",
                                          style: const TextStyle(fontWeight: FontWeight.w600),
                                        ),
                                        Text(
                                          "Deadline: ${order['deadline']}",
                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                        ),
                                      ],
                                    )
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Pending Artisan Approval':
        return Colors.orange;
      case '50% Escrow Paid':
        return Colors.blue;
      case 'In Production':
        return AppColors.gold;
      case 'Completed & Final 50% Paid':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }
}

// ---------------------------------------------------------
// Custom Order Milestone Tracker Screen
// ---------------------------------------------------------
class _CustomOrderTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> order;
  final VoidCallback onStatusChanged;

  const _CustomOrderTrackingScreen({required this.order, required this.onStatusChanged});

  @override
  State<_CustomOrderTrackingScreen> createState() => _CustomOrderTrackingScreenState();
}

class _CustomOrderTrackingScreenState extends State<_CustomOrderTrackingScreen> {
  late Map<String, dynamic> _order;

  @override
  void initState() {
    super.initState();
    _order = Map<String, dynamic>.from(widget.order);
  }

  Future<void> _updateStatus(String newStatus) async {
    final allOrders = LocalStorageService.loadList(StorageKeys.customOrders);
    final index = allOrders.indexWhere((o) => o['id'] == _order['id']);
    if (index != -1) {
      allOrders[index]['status'] = newStatus;
      await LocalStorageService.saveList(StorageKeys.customOrders, allOrders);
      setState(() {
        _order['status'] = newStatus;
      });
      widget.onStatusChanged();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Order moved to: $newStatus"), backgroundColor: AppColors.success),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isArtisan = context.watch<AuthProvider>().user?.isArtisan ?? false;
    final status = _order['status'] ?? 'Pending Artisan Approval';

    int currentStep = 0;
    if (status == 'Pending Artisan Approval') currentStep = 0;
    if (status == '50% Escrow Paid') currentStep = 1;
    if (status == 'In Production') currentStep = 2;
    if (status == 'Completed & Final 50% Paid') currentStep = 3;

    return Scaffold(
      appBar: AppBar(title: const Text("Milestone Tracker")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Milestone-Based\nEscrow Tracker",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1.2)),
            const SizedBox(height: 8),
            const Text("Your funds are held securely until verifiable progress is made.",
                style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 24),
            
            // AI Preview image
            if (_order['aiPreviewUrl'] != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: CustomImage(imageUrl: _order['aiPreviewUrl'], fit: BoxFit.cover),
                ),
              ),
            
            const SizedBox(height: 32),
            _buildStepper(currentStep),
            
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            
            // Actions based on role and status
            if (!isArtisan && currentStep == 0) ...[
              const Text("Waiting for the artisan to accept the request.", style: TextStyle(fontWeight: FontWeight.w600)),
            ],
            
            if (isArtisan && currentStep == 0) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _updateStatus('50% Escrow Paid'), // Shortcut to skip directly to payment phase for demo
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: Colors.white),
                  child: const Text("Accept Custom Request"),
                ),
              )
            ],

            if (!isArtisan && currentStep == 1) ...[
              const Text("Artisan accepted! Pay 50% Escrow to begin.", style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('In Production'),
                  icon: const Icon(Icons.lock),
                  label: Text("Pay 50% Initiation (\$${(_order['budget'] / 2).toStringAsFixed(2)})"),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                ),
              )
            ],

            if (isArtisan && currentStep == 1) ...[
               const Text("Waiting for buyer to fund 50% Escrow...", style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
            ],

            if (isArtisan && currentStep == 2) ...[
               const Text("50% Escrow Secured. Start building!", style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.success)),
               const SizedBox(height: 12),
               SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _updateStatus('Completed & Final 50% Paid'),
                  icon: const Icon(Icons.check_circle),
                  label: const Text("Request Final Payment & Complete"),
                ),
              )
            ],

            if (!isArtisan && currentStep == 2) ...[
               const Text("Artisan is working. Wait for completion to release final 50%.", style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
               const SizedBox(height: 12),
               SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('Completed & Final 50% Paid'),
                  icon: const Icon(Icons.lock_open),
                  label: Text("Release Final 50% (\$${(_order['budget'] / 2).toStringAsFixed(2)})"),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, foregroundColor: Colors.white),
                ),
              )
            ],

             if (currentStep == 3) ...[
               Container(
                 padding: const EdgeInsets.all(16),
                 decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                 child: const Row(
                   children: [
                     Icon(Icons.verified, color: AppColors.success),
                     SizedBox(width: 12),
                     Expanded(child: Text("Order completed successfully! Escrow funds released to Artisan.", style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold))),
                   ],
                 )
               )
             ]
          ],
        ),
      ),
    );
  }

  Widget _buildStepper(int currentStep) {
    return Column(
      children: [
        _step(0, currentStep, "Pending Artisan", "Waiting for artisan review"),
        _stepLine(0, currentStep),
        _step(1, currentStep, "50% Escrow Init", "Buyer deposits 50% to start"),
        _stepLine(1, currentStep),
        _step(2, currentStep, "In Production", "Artisan uploads media updates"),
        _stepLine(2, currentStep),
        _step(3, currentStep, "Completed", "Final 50% released to artisan"),
      ],
    );
  }

  Widget _step(int stepIndex, int currentStep, String title, String subtitle) {
    final isCompleted = stepIndex < currentStep;
    final isActive = stepIndex == currentStep;
    final color = isCompleted ? AppColors.success : (isActive ? AppColors.primary : AppColors.divider);

    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isCompleted ? AppColors.success : (isActive ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent),
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, size: 18, color: Colors.white)
                : Text("${stepIndex + 1}", style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: isActive || isCompleted ? FontWeight.bold : FontWeight.normal, fontSize: 16)),
            Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        )
      ],
    );
  }

  Widget _stepLine(int stepIndex, int currentStep) {
    final isCompleted = stepIndex < currentStep;
    return Padding(
      padding: const EdgeInsets.only(left: 15.0),
      child: Container(
        alignment: Alignment.centerLeft,
        height: 30,
        width: 2,
        color: isCompleted ? AppColors.success : AppColors.divider,
      ),
    );
  }
}
