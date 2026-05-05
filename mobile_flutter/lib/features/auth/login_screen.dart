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
        const SnackBar(
            content: Text("Please fill in all fields"),
            backgroundColor: AppColors.error),
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
        SnackBar(
            content: Text(auth.error ?? "Login failed"),
            backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final surfaceColor = theme.colorScheme.surface;
    final textColor = theme.colorScheme.onSurface;
    final secondaryText = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.background : AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 50),
              // Logo with gold glow
              Center(
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                          color: AppColors.gold.withValues(alpha: 0.2),
                          blurRadius: 30,
                          spreadRadius: 5)
                    ],
                  ),
                  child: Image.asset('assets/icons/logo.png',
                      width: 72, height: 72),
                ),
              ),
              const SizedBox(height: 28),
              // Title — Playfair Display like frontend
              Center(
                  child: Text("Welcome Back",
                      style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Playfair Display',
                          color: AppColors.gold))),
              const SizedBox(height: 8),
              Center(
                  child: Text("Sign in to continue exploring",
                      style: TextStyle(color: secondaryText, fontSize: 14))),
              const SizedBox(height: 48),

              // Email label
              Text("Email",
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: secondaryText)),
              const SizedBox(height: 8),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: TextStyle(color: textColor),
                decoration: const InputDecoration(
                    hintText: "your@email.com",
                    prefixIcon: Icon(Icons.email_outlined, size: 20)),
              ),
              const SizedBox(height: 24),

              // Password label
              Text("Password",
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: secondaryText)),
              const SizedBox(height: 8),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: TextStyle(color: textColor),
                decoration: InputDecoration(
                  hintText: "Enter your password",
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                        color: secondaryText),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                    onPressed: () {}, child: const Text("Forgot Password?")),
              ),
              const SizedBox(height: 24),

              // Sign In button — gold primary like frontend .btn-primary
              Consumer<AuthProvider>(
                builder: (ctx, auth, _) {
                  return ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleLogin,
                    child: auth.isLoading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.dark))
                        : const Text("Sign In"),
                  );
                },
              ),
              const SizedBox(height: 24),

              // Divider with "or"
              Row(children: [
                Expanded(child: Divider(color: isDark ? AppColors.divider : AppColors.borderLight)),
                Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text("or",
                        style: TextStyle(
                            color: secondaryText, fontSize: 13))),
                Expanded(child: Divider(color: isDark ? AppColors.divider : AppColors.borderLight)),
              ]),
              const SizedBox(height: 24),

              // Create Account — outline button like frontend .btn-outline
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
