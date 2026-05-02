import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  void _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill in all fields"), backgroundColor: AppColors.error),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);

    // Hardcoded Admin Bypass
    if (email == 'admin@mail.com' && password == 'curio123') {
      auth.setAdminBypassUser();
      Navigator.pushReplacementNamed(context, '/admin/dashboard');
      return;
    }

    final success = await auth.login(email, password);
    if (!mounted) return;

    if (success) {
      final userType = auth.user?.type;
      if (userType == "Artisan") {
        Navigator.pushReplacementNamed(context, '/artisan'); 
      } else if (userType == "Admin") {
        Navigator.pushReplacementNamed(context, '/admin/dashboard');
      } else {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? "Login failed"), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 50),
              Center(
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: AppColors.gold.withValues(alpha: 0.2), blurRadius: 30, spreadRadius: 5)],
                  ),
                  child: Image.asset('assets/icons/logo.png', width: 72, height: 72),
                ),
              ),
              const SizedBox(height: 28),
              const Center(child: Text("Welcome Back", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, fontFamily: 'Playfair', color: AppColors.gold))),
              const SizedBox(height: 8),
              Center(child: Text("Sign in to continue exploring", style: TextStyle(color: AppColors.textMuted, fontSize: 14))),
              const SizedBox(height: 48),

              const Text("Email", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: const InputDecoration(hintText: "your@email.com", prefixIcon: Icon(Icons.email_outlined, size: 20)),
              ),
              const SizedBox(height: 24),

              const Text("Password", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: "Enter your password",
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppColors.textMuted),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: () {}, child: const Text("Forgot Password?")),
              ),
              const SizedBox(height: 24),

              Consumer<AuthProvider>(
                builder: (ctx, auth, _) {
                  return ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleLogin,
                    child: auth.isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text("Sign In"),
                  );
                },
              ),
              const SizedBox(height: 24),
              Row(children: [
                Expanded(child: Divider(color: AppColors.divider)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text("or", style: TextStyle(color: AppColors.textMuted, fontSize: 13))),
                Expanded(child: Divider(color: AppColors.divider)),
              ]),
              const SizedBox(height: 24),
              OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/register'),
                child: const Text("Create Account"),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
