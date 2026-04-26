import 'package:flutter/material.dart';
import '../core/constants.dart';

class SignupScreen extends StatelessWidget {
  final _formKey = GlobalKey<FormState>();

  SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, iconTheme: IconThemeData(color: Colors.black)),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(30),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Icon(Icons.spa, color: AppColors.gold, size: 50),
              Text("Sign up", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              SizedBox(height: 30),
              Row(
                children: [
                  Expanded(child: _buildTextField("First Name", Icons.person_outline)),
                  SizedBox(width: 10),
                  Expanded(child: _buildTextField("Last Name", Icons.person_outline)),
                ],
              ),
              _buildTextField("Enter Email", Icons.email_outlined),
              _buildTextField("Mobile Phone", Icons.phone_android_outlined),
              _buildTextField("Password", Icons.lock_outline, isPassword: true),
              _buildTextField("Confirm Password", Icons.lock_outline, isPassword: true),
              SizedBox(height: 30),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  minimumSize: Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                ),
                onPressed: () {},
                child: Text("Signup", style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String hint, IconData icon, {bool isPassword = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextFormField(
        obscureText: isPassword,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 20),
          filled: true,
          fillColor: AppColors.inputFill,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
        ),
      ),
    );
  }
}