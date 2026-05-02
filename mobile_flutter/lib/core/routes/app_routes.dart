import 'package:flutter/material.dart';
import '../config/app_config.dart';

// Shared screens
import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';

// User-flavor screens
import '../../features/shell/main_shell.dart';
import '../../features/product/product_details_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/reviews/reviews_screen.dart';
import '../../features/custom_order/custom_order_screen.dart';
import '../../features/workshops/workshops_screen.dart';
import '../../features/cultural/cultural_screen.dart';
import '../../features/logistics/logistics_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shell/artisan_shell.dart';
import '../../features/chat/chat_screen.dart';
import '../../features/notifications/notifications_screen.dart';

// Admin-flavor screens
import '../../features/admin/admin_dashboard_screen.dart';

/// Centralized route definitions for the Curio app.
/// Routes are filtered by the current [AppFlavor] so admin screens
/// are never accessible in the user flavor and vice versa.
class AppRoutes {
  AppRoutes._();

  // ── Shared route names ─────────────────────────────────────────────
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';

  // ── User route names ───────────────────────────────────────────────
  static const String home = '/home';
  static const String artisan = '/artisan';
  static const String productDetails = '/product-details';
  static const String cart = '/cart';
  static const String orders = '/orders';
  static const String reviews = '/reviews';
  static const String customOrder = '/custom-order';
  static const String workshops = '/workshops';
  static const String cultural = '/cultural';
  static const String logistics = '/logistics';
  static const String settings = '/settings';
  static const String chat = '/chat';
  static const String notifications = '/notifications';

  // ── Admin route names ──────────────────────────────────────────────
  static const String adminDashboard = '/admin/dashboard';

  /// Returns the route map filtered by the active flavor.
  static Map<String, WidgetBuilder> get routes {
    final shared = <String, WidgetBuilder>{
      splash: (ctx) => const SplashScreen(),
      login: (ctx) => const LoginScreen(),
      register: (ctx) => const RegisterScreen(),
    };

    if (AppConfig.isAdmin) {
      return {
        ...shared,
        adminDashboard: (ctx) => const AdminDashboardScreen(),
      };
    }

    // User flavor
    return {
      ...shared,
      onboarding: (ctx) => const OnboardingScreen(),
      home: (ctx) => const MainShell(),
      artisan: (ctx) => const ArtisanShell(),
      productDetails: (ctx) => const ProductDetailsScreen(),
      cart: (ctx) => const CartScreen(),
      orders: (ctx) => const OrdersScreen(),
      reviews: (ctx) => const ReviewsScreen(),
      customOrder: (ctx) => const CustomOrderScreen(),
      workshops: (ctx) => const WorkshopsScreen(),
      cultural: (ctx) => const CulturalScreen(),
      logistics: (ctx) => const LogisticsScreen(),
      settings: (ctx) => const SettingsScreen(),
      chat: (ctx) => const ChatScreen(),
      notifications: (ctx) => const NotificationsScreen(),
    };
  }
}
