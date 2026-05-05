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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final user = Provider.of<AuthProvider>(context).user;
    final isGuest = user == null;
    final profileImage = user?.profileImage;
    final hasImage = profileImage != null && profileImage.isNotEmpty;

    final surfaceColor = isDark ? AppColors.surface : AppColors.surfaceLight;
    final bgColor = isDark ? AppColors.background : AppColors.backgroundLight;
    final textColor = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.divider : AppColors.borderLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text("Profile", style: TextStyle(fontFamily: 'Playfair Display')),
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
            // Avatar + Name card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: isGuest ? null : () => _pickAndSaveImage(context),
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: AppColors.gold.withValues(alpha: 0.1),
                          backgroundImage: hasImage ? FileImage(File(profileImage)) : null,
                          child: _isUploading
                            ? const CircularProgressIndicator()
                            : !hasImage
                                ? const Icon(Icons.person, size: 48, color: AppColors.gold)
                                : null,
                        ),
                        if (!isGuest && !_isUploading)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.gold,
                                shape: BoxShape.circle,
                                border: Border.all(color: surfaceColor, width: 2),
                              ),
                              child: Icon(Icons.camera_alt, color: AppColors.dark, size: 16),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(isGuest ? "Guest User" : user.fullName,
                    style: TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w700,
                      fontFamily: 'Playfair Display', color: textColor)),
                  const SizedBox(height: 4),
                  Text(isGuest ? "Log in to view stats" : "Premium ${user.type}",
                    style: TextStyle(color: secondaryText, fontSize: 13)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Menu items card
            Container(
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  if (user != null && user.isArtisan) ...[
                    _menuItem(context, Icons.add_box_outlined, "Add Product", "List a new item", '/add-product', textColor, secondaryText),
                    Divider(height: 1, indent: 56, color: borderColor),
                    _menuItem(context, Icons.storefront_outlined, "My Store", "Manage your products", '/my-store', textColor, secondaryText),
                    Divider(height: 1, indent: 56, color: borderColor),
                  ],
                  _menuItem(context, Icons.shopping_bag_outlined, "My Orders", "Track your purchases", '/orders', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.favorite_outline, "Saved Items", "Items you love", '/favorites', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.star_outline, "My Reviews", "See your feedback", '/reviews', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.local_shipping_outlined, "Track Delivery", "Order #1024", '/logistics', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.school_outlined, "Workshops", "Learn a new craft", '/workshops', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.auto_stories_outlined, "Cultural Stories", "Explore heritage", '/cultural', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.chat_bubble_outline, "Messages", "Chat with artisans", '/chat', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.notifications_outlined, "Notifications", "Stay updated", '/notifications', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItem(context, Icons.headset_mic_outlined, "Support", "Get help anytime", '/settings', textColor, secondaryText),
                  Divider(height: 1, indent: 56, color: borderColor),
                  _menuItemAction(context, Icons.logout, "Sign Out", "See you again",
                    isRed: true, textColor: textColor, secondaryText: secondaryText,
                    onTap: () {
                      Provider.of<AuthProvider>(context, listen: false).logout();
                      Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuItem(BuildContext context, IconData icon, String title, String sub, String route, Color textColor, Color secondaryText) {
    return ListTile(
      onTap: () => Navigator.pushNamed(context, route),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.gold, size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: textColor)),
      subtitle: Text(sub, style: TextStyle(fontSize: 12, color: secondaryText)),
      trailing: Icon(Icons.chevron_right, color: secondaryText, size: 20),
    );
  }

  Widget _menuItemAction(BuildContext context, IconData icon, String title, String sub,
      {bool isRed = false, required VoidCallback onTap, required Color textColor, required Color secondaryText}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: (isRed ? AppColors.error : AppColors.gold).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: isRed ? AppColors.error : AppColors.gold, size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: isRed ? AppColors.error : textColor)),
      subtitle: Text(sub, style: TextStyle(fontSize: 12, color: secondaryText)),
      trailing: Icon(Icons.chevron_right, color: secondaryText, size: 20),
    );
  }
}
