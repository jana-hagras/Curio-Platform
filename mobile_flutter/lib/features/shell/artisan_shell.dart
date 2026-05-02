import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../artisan/artisan_dashboard_screen.dart';
import '../artisan/artisan_products_screen.dart';
import '../profile/profile_screen.dart';

/// A persistent navigation shell that wraps the main tabs for Artisans.
/// Uses IndexedStack to keep each tab's state alive when switching.
class ArtisanShell extends StatefulWidget {
  const ArtisanShell({super.key});

  @override
  State<ArtisanShell> createState() => _ArtisanShellState();
}

class _ArtisanShellState extends State<ArtisanShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    ArtisanDashboardScreen(),
    ArtisanProductsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      extendBody: true,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).dividerColor),
          boxShadow: [
            BoxShadow(
              color: AppColors.gold.withValues(alpha: 0.06),
              blurRadius: 24,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: NavigationBar(
            height: 68,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            indicatorColor: AppColors.gold.withValues(alpha: 0.12),
            selectedIndex: _currentIndex,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            animationDuration: const Duration(milliseconds: 400),
            onDestinationSelected: (i) => setState(() => _currentIndex = i),
            destinations: [
              _buildDestination(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard_rounded, label: 'Dashboard'),
              _buildDestination(icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2_rounded, label: 'My Products'),
              _buildDestination(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  NavigationDestination _buildDestination({
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    return NavigationDestination(
      icon: Icon(icon, size: 24, color: AppColors.textMuted),
      selectedIcon: Icon(activeIcon, size: 24, color: AppColors.gold),
      label: label,
    );
  }
}
