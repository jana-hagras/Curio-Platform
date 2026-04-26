import 'package:flutter/material.dart';

import '../core/constants.dart';
import 'signup_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int? selectedRole; // 0 for Client, 1 for Artisan

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 30),
        child: RadioGroup<int>(
          groupValue: selectedRole ?? -1,
          onChanged: (val) => setState(() => selectedRole = val),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.spa, color: AppColors.gold, size: 40),
              SizedBox(height: 30),
              Text("Join as a client or artisan",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
              SizedBox(height: 30),
              _buildRoleCard(
                  0, Icons.work_outline, "I'm a client, looking for a bibelot"),
              SizedBox(height: 15),
              _buildRoleCard(
                  1, Icons.handyman_outlined, "I'm an artisan, maker of bibelot"),
              SizedBox(height: 40),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  minimumSize: Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25)),
                ),
                onPressed: () => Navigator.push(
                    context, MaterialPageRoute(builder: (_) => SignupScreen())),
                child:
                    Text("Join us now!", style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(int index, IconData icon, String text) {
    bool isSelected = selectedRole == index;
    return GestureDetector(
      onTap: () => setState(() => selectedRole = index),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(
              color: isSelected ? AppColors.gold : Colors.grey.shade300,
              width: 2),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.black54),
            SizedBox(width: 15),
            Expanded(child: Text(text, style: TextStyle(fontSize: 14))),
            Radio<int>(
              value: index,
              activeColor: AppColors.gold,
            ),
          ],
        ),
      ),
    );
  }
}
