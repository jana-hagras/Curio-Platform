import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math' as math;
import '../../core/theme/app_colors.dart';
import '../../core/config/app_config.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _bgController;
  late AnimationController _logoController;
  late AnimationController _shimmerController;
  late AnimationController _ringController;

  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoFadeAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<double> _glowAnimation;
  late Animation<double> _taglineFadeAnimation;
  late Animation<double> _progressFadeAnimation;

  @override
  void initState() {
    super.initState();

    // Background gradient pulsation
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);

    // Expanding ring effect
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    // Shimmer for loading indicator
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    // Main staggered logo animator
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    );

    _logoFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.35, curve: Curves.easeOut),
      ),
    );

    _logoScaleAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.05, 0.55, curve: Curves.elasticOut),
      ),
    );

    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.45, 0.75, curve: Curves.easeIn),
      ),
    );

    _taglineFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.6, 0.85, curve: Curves.easeIn),
      ),
    );

    _progressFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.75, 1.0, curve: Curves.easeIn),
      ),
    );

    _glowAnimation = Tween<double>(begin: 0.0, end: 18.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
      ),
    );

    _logoController.forward();

    Timer(const Duration(milliseconds: 3800), () {
      if (!mounted) return;
      if (AppConfig.isAdmin) {
        Navigator.pushReplacementNamed(context, '/admin/dashboard');
      } else {
        Navigator.pushReplacementNamed(context, '/onboarding');
      }
    });
  }

  @override
  void dispose() {
    _bgController.dispose();
    _logoController.dispose();
    _shimmerController.dispose();
    _ringController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.dark,
      body: Stack(
        children: [
          // Animated radial gradient background
          AnimatedBuilder(
            animation: _bgController,
            builder: (context, child) {
              return Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(0, -0.2),
                    radius: _bgController.value * 0.35 + 0.8,
                    colors: [
                      AppColors.gold.withValues(alpha: 0.12),
                      AppColors.dark,
                    ],
                  ),
                ),
              );
            },
          ),

          // Subtle particle-like dots
          ...List.generate(6, (i) {
            final random = math.Random(i);
            return Positioned(
              left: random.nextDouble() * size.width,
              top: random.nextDouble() * size.height,
              child: AnimatedBuilder(
                animation: _bgController,
                builder: (context, _) {
                  return Opacity(
                    opacity: (0.15 + _bgController.value * 0.1)
                        .clamp(0.0, 1.0),
                    child: Container(
                      width: 3 + random.nextDouble() * 3,
                      height: 3 + random.nextDouble() * 3,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.gold
                            .withValues(alpha: 0.4 + random.nextDouble() * 0.3),
                      ),
                    ),
                  );
                },
              ),
            );
          }),

          // Expanding ring behind logo
          Center(
            child: AnimatedBuilder(
              animation: _ringController,
              builder: (context, _) {
                return Container(
                  width: 200 + (_ringController.value * 120),
                  height: 200 + (_ringController.value * 120),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.gold.withValues(
                          alpha: (0.25 * (1 - _ringController.value))
                              .clamp(0.0, 1.0)),
                      width: 1.5,
                    ),
                  ),
                );
              },
            ),
          ),

          // Main content
          Center(
            child: AnimatedBuilder(
              animation: _logoController,
              builder: (context, child) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo with glow & scale
                    FadeTransition(
                      opacity: _logoFadeAnimation,
                      child: ScaleTransition(
                        scale: _logoScaleAnimation,
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.gold.withValues(
                                    alpha: (0.35 * _logoFadeAnimation.value)
                                        .clamp(0.0, 1.0)),
                                blurRadius: _glowAnimation.value * 2.5,
                                spreadRadius: _glowAnimation.value,
                              ),
                            ],
                          ),
                          child: Image.asset(
                            'assets/icons/logo.png',
                            width: 150,
                            height: 150,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),

                    // App name
                    FadeTransition(
                      opacity: _textFadeAnimation,
                      child: Text(
                        AppConfig.isAdmin ? 'CURIO ADMIN' : 'CURIO',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 44,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 12,
                          fontFamily: 'Playfair',
                          shadows: [
                            Shadow(
                              color: AppColors.gold.withValues(
                                  alpha: (0.6 * _textFadeAnimation.value)
                                      .clamp(0.0, 1.0)),
                              blurRadius: _glowAnimation.value,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tagline
                    FadeTransition(
                      opacity: _taglineFadeAnimation,
                      child: Text(
                        AppConfig.isAdmin
                            ? 'Management Console'
                            : 'Handmade with Heritage',
                        style: TextStyle(
                          color: AppColors.goldLight.withValues(alpha: 0.7),
                          fontSize: 14,
                          letterSpacing: 4,
                          fontFamily: 'Montserrat',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Bottom shimmer loading bar + established text
          Positioned(
            bottom: 60,
            left: 50,
            right: 50,
            child: AnimatedBuilder(
              animation: Listenable.merge([_progressFadeAnimation, _shimmerController]),
              builder: (context, _) {
                return Opacity(
                  opacity: _progressFadeAnimation.value.clamp(0.0, 1.0),
                  child: Column(
                    children: [
                      // Custom shimmer loading bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: SizedBox(
                          height: 3,
                          child: AnimatedBuilder(
                            animation: _shimmerController,
                            builder: (context, _) {
                              return ShaderMask(
                                shaderCallback: (bounds) {
                                  return LinearGradient(
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                    colors: [
                                      AppColors.gold.withValues(alpha: 0.15),
                                      AppColors.gold,
                                      AppColors.gold.withValues(alpha: 0.15),
                                    ],
                                    stops: [
                                      (_shimmerController.value - 0.3)
                                          .clamp(0.0, 1.0),
                                      _shimmerController.value,
                                      (_shimmerController.value + 0.3)
                                          .clamp(0.0, 1.0),
                                    ],
                                  ).createShader(bounds);
                                },
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'ESTABLISHED 2026',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.25),
                          fontSize: 10,
                          letterSpacing: 3,
                          fontFamily: 'Montserrat',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
