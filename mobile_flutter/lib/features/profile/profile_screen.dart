import 'dart:io';
import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isUploading = false;

  Future<void> _pickAndSaveImage(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;

    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);

    if (image == null) return;

    setState(() => _isUploading = true);

    try {
      // Save the local file path as the profile image
      final updatedUser = user.copyWith(profileImage: image.path);
      auth.updateUser(updatedUser);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture updated!'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update image: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final isGuest = user == null;
    final profileImage = user?.profileImage;
    final hasImage = profileImage != null && profileImage.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Profile", style: TextStyle(fontFamily: 'Playfair')),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/settings'),
            icon: const Icon(Icons.settings_outlined, size: 22)
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar + Name
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: isGuest ? null : () => _pickAndSaveImage(context),
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                          backgroundImage: hasImage ? FileImage(File(profileImage)) : null,
                          child: _isUploading
                            ? const CircularProgressIndicator()
                            : !hasImage
                                ? const Icon(Icons.person, size: 48, color: AppColors.primary)
                                : null,
                        ),
                        if (!isGuest && !_isUploading)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(isGuest ? "Guest User" : user.fullName,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, fontFamily: 'Playfair')),
                  const SizedBox(height: 4),
                  Text(isGuest ? "Log in to view stats" : "Premium ${user.type}",
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Stats
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(16)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _stat("12", "Orders"),
                  Container(width: 1, height: 36, color: Colors.white12),
                  _stat("450", "Points"),
                  Container(width: 1, height: 36, color: Colors.white12),
                  _stat("5", "Reviews"),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Menu items
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  _menuItem(context, Icons.shopping_bag_outlined, "My Orders", "Track your purchases", '/orders'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.favorite_outline, "Saved Items", "Items you love", '/favorites'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.star_outline, "My Reviews", "See your feedback", '/reviews'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.local_shipping_outlined, "Track Delivery", "Order #1024", '/logistics'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.school_outlined, "Workshops", "Learn a new craft", '/workshops'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.auto_stories_outlined, "Cultural Stories", "Explore heritage", '/cultural'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.chat_bubble_outline, "Messages", "Chat with artisans", '/chat'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.notifications_outlined, "Notifications", "Stay updated", '/notifications'),
                  const Divider(height: 1, indent: 56),
                  _menuItem(context, Icons.headset_mic_outlined, "Support", "Get help anytime", '/settings'),
                  const Divider(height: 1, indent: 56),
                  _menuItemAction(context, Icons.logout, "Sign Out", "See you again", isRed: true, onTap: () {
                    Provider.of<AuthProvider>(context, listen: false).logout();
                    Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: AppColors.primary, fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
      ],
    );
  }

  Widget _menuItem(BuildContext context, IconData icon, String title, String sub, String route) {
    return ListTile(
      onTap: () => Navigator.pushNamed(context, route),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(sub, style: const TextStyle(fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
    );
  }

  Widget _menuItemAction(BuildContext context, IconData icon, String title, String sub, {bool isRed = false, required VoidCallback onTap}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: (isRed ? AppColors.error : AppColors.primary).withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: isRed ? AppColors.error : AppColors.primary, size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: isRed ? AppColors.error : null)),
      subtitle: Text(sub, style: const TextStyle(fontSize: 12)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
    );
  }
}
