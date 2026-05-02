import 'dart:io';
import 'package:flutter/material.dart';

import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/api/api_service.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  File? _profileImage;
  late TextEditingController _nameController;
  late TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameController = TextEditingController(text: user?.fullName ?? "");
    _emailController = TextEditingController(text: user?.email ?? "");
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, maxWidth: 512, imageQuality: 80);
    if (picked != null) {
      setState(() => _profileImage = File(picked.path));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Profile photo updated!"), backgroundColor: AppColors.success),
        );
      }
    }
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Change Profile Photo", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 24),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.camera_alt_outlined, color: AppColors.primary),
                ),
                title: const Text("Take Photo", style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
                ),
                title: const Text("Choose from Gallery", style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); },
              ),
              if (_profileImage != null)
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.delete_outline, color: AppColors.error),
                  ),
                  title: const Text("Remove Photo", style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.error)),
                  onTap: () { Navigator.pop(context); setState(() => _profileImage = null); },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text("Settings")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Profile photo section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: _showImagePicker,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 52,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                          backgroundImage: _profileImage != null ? FileImage(_profileImage!) : null,
                          child: _profileImage == null
                              ? const Icon(Icons.person, size: 52, color: AppColors.primary)
                              : null,
                        ),
                        Positioned(
                          bottom: 0, right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                            child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text("Tap photo to change", style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Edit profile fields
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Edit Profile", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 20),
                  const Text("Full Name", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  TextField(controller: _nameController, decoration: const InputDecoration(prefixIcon: Icon(Icons.person_outline, size: 20))),
                  const SizedBox(height: 20),
                  const Text("Email", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  TextField(controller: _emailController, decoration: const InputDecoration(prefixIcon: Icon(Icons.email_outlined, size: 20))),
                  const SizedBox(height: 24),
                  Consumer<AuthProvider>(builder: (context, auth, _) {
                    return ElevatedButton(
                      onPressed: () async {
                        final user = auth.user;
                        if (user == null) return;
                        try {
                          final names = _nameController.text.trim().split(' ');
                          final fName = names.isNotEmpty ? names.first : '';
                          final lName = names.length > 1 ? names.sublist(2).join(' ') : '';
                          
                          await ApiService.put('/user?id=${user.id}', body: {
                            'first_name': fName,
                            'last_name': lName,
                            'email': _emailController.text.trim(),
                          });
                          
                          final updated = user.copyWith(
                            firstName: fName,
                            lastName: lName,
                            email: _emailController.text.trim(),
                          );
                          auth.updateUser(updated);

                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Profile updated!"), backgroundColor: AppColors.success),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text("Failed to update: $e"), backgroundColor: AppColors.error),
                            );
                          }
                        }
                      },
                      child: const Text("Save Changes"),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Other settings
            Container(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
              child: Column(
                children: [
                  _tile(Icons.lock_outline, "Change Password"),
                  const Divider(height: 1, indent: 56),
                  _tile(Icons.notifications_outlined, "Notification Preferences"),
                  const Divider(height: 1, indent: 56),
                  _tile(Icons.info_outline, "About Curio"),
                  const Divider(height: 1, indent: 56),
                  _tile(Icons.description_outlined, "Terms of Service"),
                  const Divider(height: 1, indent: 56),
                  _tile(Icons.shield_outlined, "Privacy Policy"),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Container(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
              child: _tile(Icons.delete_outline, "Delete Account", isRed: true),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _tile(IconData icon, String title, {bool isRed = false}) {
    return ListTile(
      leading: Icon(icon, size: 20, color: isRed ? AppColors.error : AppColors.primary),
      title: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: isRed ? AppColors.error : null)),
      trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.textSecondary),
    );
  }
}
