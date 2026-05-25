import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isArtisan = user?.isArtisan ?? false;
    final isAdmin = user?.isAdmin ?? false;

    return Drawer(
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.gold.withValues(alpha: 0.15),
                    child: Text(
                      user?.firstName.substring(0, 1).toUpperCase() ?? 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${user?.firstName ?? ''} ${user?.lastName ?? ''}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.divider),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 16),
                children: [
                  _drawerItem(
                    context,
                    icon: Icons.home_outlined,
                    label: 'Home',
                    route: isArtisan ? '/artisan' : '/home',
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    route: '/profile',
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.chat_bubble_outline,
                    label: 'Messages',
                    route: '/inbox',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    child: Text('MARKETPLACE & PROJECTS',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                            color: AppColors.textMuted)),
                  ),
                  // Cart with badge
                  if (!isAdmin)
                    _cartDrawerItem(context),
                  _drawerItem(
                    context,
                    icon: Icons.shopping_bag_outlined,
                    label: 'Orders',
                    route: '/orders',
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.favorite_outline,
                    label: 'Favorites',
                    route: '/favorites',
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.auto_awesome_outlined,
                    label: 'Custom Requests',
                    route: isArtisan ? '/artisan-requests' : '/custom-orders-list',
                  ),
                  if (!isArtisan && !isAdmin)
                    _drawerItem(
                      context,
                      icon: Icons.request_quote_outlined,
                      label: 'Proposals & Milestones',
                      route: '/proposals',
                    ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    child: Text('LEARN & GROW',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                            color: AppColors.textMuted)),
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.handyman_outlined,
                    label: 'Workshops',
                    route: '/workshops',
                  ),
                  _drawerItem(
                    context,
                    icon: Icons.school_outlined,
                    label: 'Mentorship',
                    route: '/workshops', // Mentorship is a tab inside WorkshopsScreen
                  ),
                  const Divider(height: 32, color: AppColors.divider),
                  // Help Line (non-admin only)
                  if (!isAdmin)
                    _helpLineItem(context),
                  _drawerItem(
                    context,
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    route: '/settings',
                  ),
                  ListTile(
                    leading: const Icon(Icons.logout, color: AppColors.error),
                    title: const Text('Logout',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.error)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 24),
                    onTap: () {
                      Provider.of<AuthProvider>(context, listen: false).logout();
                      Navigator.pushNamedAndRemoveUntil(
                          context, '/login', (route) => false);
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

  Widget _drawerItem(BuildContext context,
      {required IconData icon, required String label, required String route}) {
    // Determine active state by checking current route name
    final currentRoute = ModalRoute.of(context)?.settings.name;
    final isActive = currentRoute == route;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? AppColors.gold : AppColors.textSecondary,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor:
            isActive ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
        onTap: () {
          // If already on the screen, just close drawer
          if (isActive) {
            Navigator.pop(context);
            return;
          }
          // Close drawer
          Navigator.pop(context);
          
          // Depending on if it's a root shell route or nested, we might want to push.
          // For safety, we pushNamed. If we wanted to switch tabs, we'd need to use a Shell navigation manager, 
          // but pushNamed works well for these deeply nested or modal screens.
          Navigator.pushNamed(context, route);
        },
      ),
    );
  }

  /// Cart item with item count badge.
  Widget _cartDrawerItem(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name;
    final isActive = currentRoute == '/cart';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Consumer<CartProvider>(
        builder: (context, cart, _) {
          return ListTile(
            leading: Badge(
              isLabelVisible: cart.itemCount > 0,
              label: Text('${cart.itemCount}',
                  style: const TextStyle(fontSize: 10)),
              backgroundColor: AppColors.primary,
              child: Icon(
                Icons.shopping_cart_outlined,
                color: isActive ? AppColors.gold : AppColors.textSecondary,
              ),
            ),
            title: Text(
              'Cart',
              style: TextStyle(
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                color: isActive ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: isActive
                ? AppColors.gold.withValues(alpha: 0.1)
                : Colors.transparent,
            onTap: () {
              Navigator.pop(context);
              if (!isActive) Navigator.pushNamed(context, '/cart');
            },
          );
        },
      ),
    );
  }

  /// Help Line drawer item that opens admin chat.
  Widget _helpLineItem(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        leading: const Icon(Icons.support_agent, color: AppColors.info),
        title: const Text('Help Line',
            style: TextStyle(fontWeight: FontWeight.w500)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        onTap: () {
          Navigator.pop(context);
          Navigator.pushNamed(context, '/chat', arguments: {
            'peerId': 3, // Admin user id
            'peerName': 'Curio Support',
            'isHelpLine': true,
          });
        },
      ),
    );
  }
}
