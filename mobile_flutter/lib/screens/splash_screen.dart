import 'dart:async';
import 'package:flutter/material.dart';
import '../core/constants.dart';
import 'onboarding_screen.dart';

class SplashScreen2 extends StatefulWidget {
  const SplashScreen2({super.key});

  @override
  State<SplashScreen2> createState() => _SplashScreen2State();
}

class _SplashScreen2State extends State<SplashScreen2> {
  @override
  void initState() {
    super.initState();
    Timer(Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => OnboardingScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.spa,
                    color: AppColors.gold, size: 60), // Placeholder logo
                SizedBox(height: 20),
                Text("CURIO", style: AppStyles.heading),
                Text(
                  "WHERE HERITAGE MEETS HANDCRAFT",
                  style: TextStyle(
                      color: Colors.white70, fontSize: 10, letterSpacing: 1.5),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 50,
            left: 40,
            right: 40,
            child: Column(
              children: [
                LinearProgressIndicator(
                  backgroundColor: Colors.white10,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
                SizedBox(height: 10),
                Text("ESTABLISHED 2026",
                    style: TextStyle(color: Colors.white24, fontSize: 10)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
