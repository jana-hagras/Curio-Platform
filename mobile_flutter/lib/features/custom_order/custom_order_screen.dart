import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/local_storage/local_storage_service.dart';
import '../../core/local_storage/storage_keys.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Custom Request")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Create a Custom\nRequest", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, fontFamily: 'Playfair', height: 1.3)),
            const SizedBox(height: 8),
            const Text("Describe the piece you want and an artisan will bring it to life.", style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 28),

            _label("Category"),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: ["Pottery", "Textiles", "Jewelry", "Decor"].map((c) {
                final sel = _selectedCategory == c;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = c),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: sel ? AppColors.primary : AppColors.divider),
                    ),
                    child: Text(c, style: TextStyle(color: sel ? Colors.white : AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            _label("Description"),
            TextField(
              controller: _descCtrl,
              maxLines: 5,
              decoration: const InputDecoration(hintText: "Describe what you want in detail..."),
            ),
            const SizedBox(height: 24),

            _label("Budget (EGP)"),
            TextField(
              controller: _budgetCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: "e.g. 500", prefixIcon: Icon(Icons.payments_outlined, size: 20)),
            ),
            const SizedBox(height: 24),

            _label("Deadline"),
            TextField(
              controller: _deadlineCtrl,
              decoration: const InputDecoration(hintText: "e.g. 2 weeks", prefixIcon: Icon(Icons.schedule_outlined, size: 20)),
            ),
            const SizedBox(height: 36),

            ElevatedButton(
              onPressed: () {
                if (_descCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Please add a description"), backgroundColor: AppColors.error),
                  );
                  return;
                }

                final auth = Provider.of<AuthProvider>(context, listen: false);
                final user = auth.user;

                // Save custom order to local storage (visible to both buyer and artisan)
                final customOrders = LocalStorageService.loadList(StorageKeys.customOrders);
                final newId = customOrders.isEmpty ? 1 : (customOrders.last['id'] as int) + 1;

                customOrders.add({
                  'id': newId,
                  'buyerId': user?.id ?? 0,
                  'buyerName': user?.fullName ?? 'Guest',
                  'artisanId': 2, // Default artisan
                  'category': _selectedCategory,
                  'description': _descCtrl.text.trim(),
                  'budget': double.tryParse(_budgetCtrl.text) ?? 0,
                  'deadline': _deadlineCtrl.text.trim(),
                  'status': 'Pending',
                  'dateSubmitted': DateTime.now().toIso8601String().split('T').first,
                });

                LocalStorageService.saveList(StorageKeys.customOrders, customOrders);

                // Add notification
                Provider.of<NotificationProvider>(context, listen: false).addNotification(
                  title: 'Custom Order Submitted!',
                  body: 'Your ${_selectedCategory.toLowerCase()} request has been sent to the artisan.',
                  icon: 'check_circle',
                  color: 'success',
                );

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Request submitted successfully!"), backgroundColor: AppColors.success),
                );
                Navigator.pop(context);
              },
              child: const Text("Submit Request"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(t, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
  );
}
