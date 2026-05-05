import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  String _selectedType = 'Buyer';

  void _handleRegister() async {
    if (_firstNameCtrl.text.trim().isEmpty || _lastNameCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty || _passwordCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill in all fields"), backgroundColor: AppColors.error),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.register(
      fName: _firstNameCtrl.text.trim(),
      lName: _lastNameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text.trim(),
      type: _selectedType,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Account created! Please sign in."), backgroundColor: AppColors.success),
      );
      Navigator.pushReplacementNamed(context, '/login');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? "Registration failed"), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final divColor = isDark ? AppColors.divider : AppColors.borderLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.background : AppColors.backgroundLight,
      appBar: AppBar(title: const Text("Create Account")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Center(child: Image.asset('assets/icons/logo.png', width: 56, height: 56)),
              const SizedBox(height: 24),
              Center(child: Text("Join Curio", style: TextStyle(
                fontSize: 26, fontWeight: FontWeight.w800,
                fontFamily: 'Playfair Display', color: textColor))),
              const SizedBox(height: 8),
              Center(child: Text("Start your artisan journey", style: TextStyle(color: secondaryText, fontSize: 14))),
              const SizedBox(height: 36),

              // Role selector — matches frontend .auth-type-selector
              Row(children: [
                _roleChip("Buyer", Icons.shopping_bag_outlined, isDark, divColor),
                const SizedBox(width: 12),
                _roleChip("Artisan", Icons.brush_outlined, isDark, divColor),
              ]),
              const SizedBox(height: 28),

              _label("First Name", secondaryText),
              TextField(
                controller: _firstNameCtrl,
                style: TextStyle(color: textColor),
                decoration: const InputDecoration(hintText: "Your first name"),
              ),
              const SizedBox(height: 20),
              _label("Last Name", secondaryText),
              TextField(
                controller: _lastNameCtrl,
                style: TextStyle(color: textColor),
                decoration: const InputDecoration(hintText: "Your last name"),
              ),
              const SizedBox(height: 20),
              _label("Email", secondaryText),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: TextStyle(color: textColor),
                decoration: const InputDecoration(hintText: "your@email.com", prefixIcon: Icon(Icons.email_outlined, size: 20)),
              ),
              const SizedBox(height: 20),
              _label("Password", secondaryText),
              TextField(
                controller: _passwordCtrl,
                obscureText: _obscure,
                style: TextStyle(color: textColor),
                decoration: InputDecoration(
                  hintText: "Min. 8 characters",
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: secondaryText),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Consumer<AuthProvider>(
                builder: (ctx, auth, _) {
                  return ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleRegister,
                    child: auth.isLoading
                        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.dark))
                        : const Text("Create Account"),
                  );
                },
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Already have an account?", style: TextStyle(color: secondaryText)),
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text("Sign In", style: TextStyle(fontWeight: FontWeight.w700))),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text, Color color) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: color)),
  );

  Widget _roleChip(String role, IconData icon, bool isDark, Color borderColor) {
    final selected = _selectedType == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedType = role),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primary
                : (isDark ? Colors.transparent : AppColors.surfaceLight),
            borderRadius: BorderRadius.circular(16), // --radius-lg
            border: Border.all(
              color: selected ? AppColors.primary : borderColor,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: selected ? AppColors.dark : (isDark ? AppColors.textSecondary : AppColors.textSecondaryLight)),
              const SizedBox(width: 8),
              Text(role, style: TextStyle(
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.dark : (isDark ? AppColors.textSecondary : AppColors.textSecondaryLight),
              )),
            ],
          ),
        ),
      ),
    );
  }
}
