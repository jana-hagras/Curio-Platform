import 'package:flutter/material.dart';

// Screens
import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/admin/admin_screen.dart';
import '../../features/admin/admin_users_screen.dart';
import '../../features/admin/admin_verify_screen.dart';
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
import '../../features/artisan/artisan_screen.dart';
import '../../features/chat/chat_screen.dart';
import '../../features/notifications/notifications_screen.dart';

/// Centralized route definitions for the Curio app.
class AppRoutes {
  AppRoutes._();

  // Route names
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String artisan = '/artisan';
  static const String admin = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminVerify = '/admin/verify';
  static const String home = '/home';
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

  /// All named routes used by MaterialApp.
  static Map<String, WidgetBuilder> get routes => {
        splash: (ctx) => const SplashScreen(),
        onboarding: (ctx) => const OnboardingScreen(),
        login: (ctx) => const LoginScreen(),
        register: (ctx) => const RegisterScreen(),
        artisan: (ctx) => const ArtisanScreen(),
        admin: (ctx) => const AdminScreen(),
        adminUsers: (ctx) => const AdminUsersScreen(),
        adminVerify: (ctx) => const AdminVerifyScreen(),
        home: (ctx) => const MainShell(),
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
