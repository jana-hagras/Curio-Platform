import 'package:flutter/material.dart';
import 'dart:async';
import '../../core/theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _bgController;
  late AnimationController _logoController;
  
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoFadeAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    
    // Background gradient animator
    _bgController = AnimationController(
       vsync: this, 
       duration: const Duration(seconds: 4)
    )..repeat(reverse: true);

    // Main staggered logo animator
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    _logoFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0.0, 0.4, curve: Curves.easeOut)),
    );

    _logoScaleAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0.1, 0.6, curve: Curves.elasticOut)),
    );

    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0.5, 0.9, curve: Curves.easeIn)),
    );

    _glowAnimation = Tween<double>(begin: 0.0, end: 15.0).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0.6, 1.0, curve: Curves.easeInOut)),
    );

    _logoController.forward();

    Timer(const Duration(milliseconds: 3500), () {
      if (mounted) Navigator.pushReplacementNamed(context, '/onboarding');
    });
  }

  @override
  void dispose() {
    _bgController.dispose();
    _logoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      body: AnimatedBuilder(
        animation: _bgController,
        builder: (context, child) {
          return Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.2),
                radius: _bgController.value * 0.4 + 0.8,
                colors: [
                  AppColors.primary.withValues(alpha: 0.15),
                  AppColors.dark,
                ],
              ),
            ),
            child: child,
          );
        },
        child: Center(
          child: AnimatedBuilder(
            animation: _logoController,
            builder: (context, child) {
              return Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FadeTransition(
                    opacity: _logoFadeAnimation,
                    child: ScaleTransition(
                      scale: _logoScaleAnimation,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3 * _logoFadeAnimation.value),
                              blurRadius: _glowAnimation.value * 2,
                              spreadRadius: _glowAnimation.value,
                            )
                          ]
                        ),
                        child: Image.asset(
                          'assets/icons/logo.png',
                          width: 140,
                          height: 140,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  FadeTransition(
                    opacity: _textFadeAnimation,
                    child: Column(
                      children: [
                        Text(
                          "CURIO",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 42,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 10,
                            fontFamily: 'Playfair',
                            shadows: [
                              Shadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: _glowAnimation.value)
                            ]
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "Handmade with Heritage",
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 14,
                            letterSpacing: 3,
                            fontFamily: 'Montserrat',
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
