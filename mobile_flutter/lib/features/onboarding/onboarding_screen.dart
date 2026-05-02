import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:math' as math;
import '../../core/theme/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  late AnimationController _bgController;
  late AnimationController _contentController;

  final List<_OnboardingItem> _items = [
    _OnboardingItem(
      title: 'Discover Unique\nEgyptian Crafts',
      description:
          'Explore handmade products from talented Egyptian artisans, each piece carrying centuries of heritage and cultural significance.',
      icon: Icons.auto_awesome_outlined,
      accentColor: AppColors.gold,
      bgGradient: [
        Color(0xFF1A1A2E),
        Color(0xFF16213E),
      ],
    ),
    _OnboardingItem(
      title: 'Custom Made\nJust for You',
      description:
          'Every creation can be tailored to your taste. Collaborate directly with skilled artisans to bring your vision to life.',
      icon: Icons.brush_outlined,
      accentColor: AppColors.accentOrange,
      bgGradient: [
        Color(0xFF1A1A2E),
        Color(0xFF2D1B2E),
      ],
    ),
    _OnboardingItem(
      title: 'Delivered\nWorldwide',
      description:
          'Authentic craftsmanship shipped to your doorstep, anywhere in the world, with care, tracking, and full support.',
      icon: Icons.public_outlined,
      accentColor: AppColors.accentBlue,
      bgGradient: [
        Color(0xFF1A1A2E),
        Color(0xFF0F2027),
      ],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat(reverse: true);

    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _bgController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() => _currentPage = page);
    _contentController.reset();
    _contentController.forward();
  }

  Future<void> _navigateToLogin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenOnboarding', true);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final item = _items[_currentPage];

    return Scaffold(
      body: Stack(
        children: [
          // Animated gradient background
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: item.bgGradient,
              ),
            ),
          ),

          // Floating decorative circles
          ...List.generate(4, (i) {
            final random = math.Random(i + _currentPage * 10);
            return Positioned(
              left: random.nextDouble() * size.width - 40,
              top: random.nextDouble() * size.height - 40,
              child: AnimatedBuilder(
                animation: _bgController,
                builder: (context, _) {
                  final baseSize = 60.0 + random.nextDouble() * 100;
                  return Container(
                    width: baseSize + (_bgController.value * 20),
                    height: baseSize + (_bgController.value * 20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: item.accentColor.withValues(
                        alpha: 0.03 + random.nextDouble() * 0.04,
                      ),
                    ),
                  );
                },
              ),
            );
          }),

          // Main content
          SafeArea(
            child: Column(
              children: [
                // Skip button
                Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 8, 16, 0),
                    child: TextButton(
                      onPressed: _navigateToLogin,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white54,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 10,
                        ),
                      ),
                      child: const Text(
                        'Skip',
                        style: TextStyle(
                          fontSize: 15,
                          letterSpacing: 0.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),

                // PageView
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    physics: const BouncingScrollPhysics(),
                    onPageChanged: _onPageChanged,
                    itemCount: _items.length,
                    itemBuilder: (ctx, i) =>
                        _buildPage(context, _items[i], i),
                  ),
                ),

                // Bottom section: indicators + button
                Padding(
                  padding: const EdgeInsets.fromLTRB(32, 0, 32, 48),
                  child: Column(
                    children: [
                      // Dot indicators
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _items.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 350),
                            curve: Curves.easeOut,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 6,
                            width: _currentPage == i ? 32 : 6,
                            decoration: BoxDecoration(
                              color: _currentPage == i
                                  ? _items[_currentPage].accentColor
                                  : Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(3),
                              boxShadow: _currentPage == i
                                  ? [
                                      BoxShadow(
                                        color: _items[_currentPage]
                                            .accentColor
                                            .withValues(alpha: 0.4),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),

                      // CTA Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              colors: [
                                _items[_currentPage].accentColor,
                                _items[_currentPage]
                                    .accentColor
                                    .withValues(alpha: 0.8),
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: _items[_currentPage]
                                    .accentColor
                                    .withValues(alpha: 0.35),
                                blurRadius: 16,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: () {
                              if (_currentPage == _items.length - 1) {
                                _navigateToLogin();
                              } else {
                                _pageController.nextPage(
                                  duration: const Duration(milliseconds: 500),
                                  curve: Curves.easeInOut,
                                );
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  _currentPage == _items.length - 1
                                      ? 'Get Started'
                                      : 'Continue',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  _currentPage == _items.length - 1
                                      ? Icons.arrow_forward_rounded
                                      : Icons.chevron_right_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPage(BuildContext context, _OnboardingItem item, int index) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Animated icon container with double ring
          AnimatedBuilder(
            animation: _contentController,
            builder: (context, child) {
              final progress = CurvedAnimation(
                parent: _contentController,
                curve: Curves.elasticOut,
              ).value;
              return Transform.scale(
                scale: 0.5 + (progress * 0.5),
                child: Opacity(
                  opacity: _contentController.value.clamp(0.0, 1.0),
                  child: child,
                ),
              );
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer glow ring
                Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: item.accentColor.withValues(alpha: 0.1),
                      width: 2,
                    ),
                  ),
                ),
                // Inner circle with icon
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        item.accentColor.withValues(alpha: 0.15),
                        item.accentColor.withValues(alpha: 0.05),
                      ],
                    ),
                    border: Border.all(
                      color: item.accentColor.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: item.accentColor.withValues(alpha: 0.15),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Icon(
                    item.icon,
                    size: 64,
                    color: item.accentColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 56),

          // Title
          AnimatedBuilder(
            animation: _contentController,
            builder: (context, child) {
              final slide = Tween<Offset>(
                begin: const Offset(0, 0.3),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: _contentController,
                curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
              ));
              final fade = Tween<double>(begin: 0, end: 1).animate(
                CurvedAnimation(
                  parent: _contentController,
                  curve: const Interval(0.2, 0.7),
                ),
              );
              return SlideTransition(
                position: slide,
                child: FadeTransition(opacity: fade, child: child),
              );
            },
            child: Text(
              item.title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w800,
                fontFamily: 'Playfair',
                color: Colors.white,
                height: 1.3,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Description
          AnimatedBuilder(
            animation: _contentController,
            builder: (context, child) {
              final fade = Tween<double>(begin: 0, end: 1).animate(
                CurvedAnimation(
                  parent: _contentController,
                  curve: const Interval(0.4, 0.9),
                ),
              );
              return FadeTransition(opacity: fade, child: child);
            },
            child: Text(
              item.description,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Colors.white.withValues(alpha: 0.6),
                height: 1.7,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingItem {
  final String title, description;
  final IconData icon;
  final Color accentColor;
  final List<Color> bgGradient;

  _OnboardingItem({
    required this.title,
    required this.description,
    required this.icon,
    required this.accentColor,
    required this.bgGradient,
  });
}
