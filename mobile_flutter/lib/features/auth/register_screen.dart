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
    return Scaffold(
      backgroundColor: Colors.white,
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
              const Center(child: Text("Join Curio", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, fontFamily: 'Playfair'))),
              const SizedBox(height: 8),
              const Center(child: Text("Start your artisan journey", style: TextStyle(color: AppColors.textSecondary, fontSize: 14))),
              const SizedBox(height: 36),

              Row(children: [_roleChip("Buyer", Icons.shopping_bag_outlined), const SizedBox(width: 12), _roleChip("Artisan", Icons.brush_outlined)]),
              const SizedBox(height: 28),

              _label("First Name"),
              TextField(controller: _firstNameCtrl, decoration: const InputDecoration(hintText: "Your first name")),
              const SizedBox(height: 20),
              _label("Last Name"),
              TextField(controller: _lastNameCtrl, decoration: const InputDecoration(hintText: "Your last name")),
              const SizedBox(height: 20),
              _label("Email"),
              TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(hintText: "your@email.com", prefixIcon: Icon(Icons.email_outlined, size: 20))),
              const SizedBox(height: 20),
              _label("Password"),
              TextField(
                controller: _passwordCtrl,
                obscureText: _obscure,
                decoration: InputDecoration(
                  hintText: "Min. 8 characters",
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20), onPressed: () => setState(() => _obscure = !_obscure)),
                ),
              ),
              const SizedBox(height: 32),
              Consumer<AuthProvider>(
                builder: (ctx, auth, _) {
                  return ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleRegister,
                    child: auth.isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text("Create Account"),
                  );
                },
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Already have an account?"),
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

  Widget _label(String text) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)));

  Widget _roleChip(String role, IconData icon) {
    final selected = _selectedType == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedType = role),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: selected ? AppColors.primary : AppColors.divider),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: selected ? Colors.white : AppColors.textSecondary),
              const SizedBox(width: 8),
              Text(role, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}
