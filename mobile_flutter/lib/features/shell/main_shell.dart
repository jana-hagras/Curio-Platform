import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../home/home_screen.dart';
import '../search/search_screen.dart';
import '../chat/conversations_screen.dart';
import '../profile/profile_screen.dart';

/// A persistent navigation shell that wraps the main tabs.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    SearchScreen(),
    ConversationsScreen(),
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
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: AppColors.divider.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: NavigationBar(
            height: 64,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            indicatorColor: AppColors.gold.withValues(alpha: 0.15),
            selectedIndex: _currentIndex,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysHide, // Cleaner look
            animationDuration: const Duration(milliseconds: 300),
            onDestinationSelected: (i) => setState(() => _currentIndex = i),
            destinations: [
              _buildDestination(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  label: 'Home'),
              _buildDestination(
                  icon: Icons.storefront_outlined,
                  activeIcon: Icons.storefront_rounded,
                  label: 'Shop'),
              _buildDestination(
                  icon: Icons.chat_bubble_outline,
                  activeIcon: Icons.chat_bubble_rounded,
                  label: 'Chat'),
              _buildDestination(
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  label: 'Profile'),
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
      icon: Icon(icon, size: 26, color: AppColors.textMuted),
      selectedIcon: Icon(activeIcon, size: 26, color: AppColors.gold),
      label: label,
      tooltip: label, // Show tooltip since labels are hidden
    );
  }
}
