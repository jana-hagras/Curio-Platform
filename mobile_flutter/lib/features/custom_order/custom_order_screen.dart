import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../shared/widgets/custom_image.dart';

class CustomOrderScreen extends StatefulWidget {
  const CustomOrderScreen({super.key});

  @override
  State<CustomOrderScreen> createState() => _CustomOrderScreenState();
}

class _CustomOrderScreenState extends State<CustomOrderScreen> {
  String _selectedCategory = 'Pottery';
  final _descCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  final _deadlineCtrl = TextEditingController();

  // AI 3D Generation State
  bool _isGenerating = false;
  String? _generatedImageUrl;
  String _generationStep = '';

  @override
  void dispose() {
    _descCtrl.dispose();
    _budgetCtrl.dispose();
    _deadlineCtrl.dispose();
    super.dispose();
  }

  Future<void> _generateAIPreview() async {
    if (_descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please add a description to generate an AI design."),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isGenerating = true;
      _generatedImageUrl = null;
      _generationStep = 'Analyzing description...';
    });

    // Mock AI text-to-prompt refinement delay
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _generationStep = 'Refining prompt via LLM...');

    // Mock Meshy AI 3D Generation delay
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    setState(() => _generationStep = 'Generating 3D model (Meshy AI)...');

    // Mock finalization
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    setState(() {
      _isGenerating = false;
      // Using a premium placeholder image to simulate the 3D render output
      _generatedImageUrl =
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80';
    });
  }

  void _submitRequest() {
    if (_descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Please add a description"),
            backgroundColor: AppColors.error),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;

    // Save custom order to local storage (visible to both buyer and artisan)
    final customOrders =
        LocalStorageService.loadList(StorageKeys.customOrders);
    final newId =
        customOrders.isEmpty ? 1 : (customOrders.last['id'] as int) + 1;

    customOrders.add({
      'id': newId,
      'buyerId': user?.id ?? 0,
      'buyerName': user?.fullName ?? 'Guest',
      'artisanId': 2, // Default artisan (Anas) for mock
      'category': _selectedCategory,
      'description': _descCtrl.text.trim(),
      'budget': double.tryParse(_budgetCtrl.text) ?? 0,
      'deadline': _deadlineCtrl.text.trim(),
      'status': 'Pending Artisan Approval', // Milestone 1
      'dateSubmitted': DateTime.now().toIso8601String().split('T').first,
      'aiPreviewUrl': _generatedImageUrl, // Attach AI preview
    });

    LocalStorageService.saveList(StorageKeys.customOrders, customOrders);

    // Add notification
    Provider.of<NotificationProvider>(context, listen: false).addNotification(
      title: 'Custom Order Submitted!',
      body:
          'Your ${_selectedCategory.toLowerCase()} request has been sent to the artisan for review.',
      icon: 'auto_awesome',
      color: 'primary',
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text("Request submitted to artisan successfully!"),
          backgroundColor: AppColors.success),
    );
    
    // Navigate back to profile or tracking screen
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI Design Studio")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Dream it. 3D it.\nOwn it.",
                style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gold,
                    height: 1.2)),
            const SizedBox(height: 8),
            const Text(
                "Describe your vision and our AI will generate a 3D model preview for the artisan.",
                style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 28),
            _label("Category"),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ["Pottery", "Textiles", "Jewelry", "Decor"].map((c) {
                final sel = _selectedCategory == c;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = c),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 10),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: sel ? AppColors.primary : AppColors.divider),
                    ),
                    child: Text(c,
                        style: TextStyle(
                            color: sel ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13)),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            _label("Description"),
            TextField(
              controller: _descCtrl,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText:
                    "E.g. A tall ceramic vase with dark blue geometric Nubian patterns and a gold rim...",
              ),
            ),
            const SizedBox(height: 20),

            // AI Generation Area
            if (_isGenerating)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    const CircularProgressIndicator(color: AppColors.gold),
                    const SizedBox(height: 16),
                    Text(_generationStep,
                        style: const TextStyle(
                            color: AppColors.gold, fontWeight: FontWeight.w600)),
                  ],
                ),
              )
            else if (_generatedImageUrl != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                      const SizedBox(width: 8),
                      const Text("AI 3D Preview Generated",
                          style: TextStyle(
                              color: AppColors.success,
                              fontWeight: FontWeight.w700)),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: _generateAIPreview,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text("Regenerate"),
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      height: 250,
                      width: double.infinity,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CustomImage(
                            imageUrl: _generatedImageUrl,
                            fit: BoxFit.cover,
                          ),
                          // Simulated 3D icon overlay
                          Positioned(
                            bottom: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: const Icon(Icons.view_in_ar,
                                  color: Colors.white, size: 24),
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              )
            else
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _generateAIPreview,
                  icon: const Icon(Icons.auto_awesome, color: AppColors.gold),
                  label: const Text("Generate AI 3D Preview"),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.gold,
                    side: const BorderSide(color: AppColors.gold, width: 1.5),
                  ),
                ),
              ),

            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _label("Budget (USD)"),
                      TextField(
                        controller: _budgetCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            hintText: "e.g. 500",
                            prefixIcon:
                                Icon(Icons.payments_outlined, size: 20)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _label("Deadline"),
                      TextField(
                        controller: _deadlineCtrl,
                        decoration: const InputDecoration(
                            hintText: "e.g. 2 weeks",
                            prefixIcon:
                                Icon(Icons.schedule_outlined, size: 20)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 36),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _submitRequest,
                child: const Text("Submit Request to Artisan"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(t,
            style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: AppColors.textSecondary)),
      );
}
