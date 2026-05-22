import 'package:flutter/material.dart';

// Shared screens
import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';

// User-flavor screens
import '../../features/shell/main_shell.dart';
import '../../features/product/product_details_screen.dart';
import '../../features/product/add_product_screen.dart';
import '../../features/artisan/artisan_products_screen.dart';
import '../../features/artisan/artisan_requests_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/order_confirmation_screen.dart';
import '../../features/orders/order_details_screen.dart';
import '../../features/reviews/reviews_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/custom_order/custom_order_screen.dart';
import '../../features/custom_order/custom_orders_list_screen.dart';
import '../../features/workshops/workshops_screen.dart';
import '../../features/cultural/cultural_screen.dart';
import '../../features/logistics/logistics_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shell/artisan_shell.dart';
import '../../features/chat/chat_screen.dart';
import '../../features/chat/conversations_screen.dart';
import '../../features/chat/artisan_directory_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/favorites_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/proposals/buyer_proposals_screen.dart';

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
  static const String addProduct = '/add-product';
  static const String myStore = '/my-store';
  static const String artisanRequests = '/artisan-requests';
  static const String cart = '/cart';
  static const String orders = '/orders';
  static const String orderDetails = '/order-details';
  static const String checkout = '/checkout';
  static const String orderConfirmation = '/order-confirmation';
  static const String reviews = '/reviews';
  static const String favorites = '/favorites';
  static const String profile = '/profile';
  static const String search = '/search';
  static const String customOrder = '/custom-order';
  static const String customOrdersList = '/custom-orders-list';
  static const String proposals = '/proposals';
  static const String workshops = '/workshops';
  static const String cultural = '/cultural';
  static const String logistics = '/logistics';
  static const String settings = '/settings';
  static const String chat = '/chat';
  static const String inbox = '/inbox';
  static const String artisanDirectory = '/artisan-directory';
  static const String notifications = '/notifications';

  // ── Admin route names ──────────────────────────────────────────────
  static const String adminDashboard = '/admin/dashboard';

  /// Returns the complete route map.
  static Map<String, WidgetBuilder> get routes {
    return {
      // Shared
      splash: (ctx) => const SplashScreen(),
      login: (ctx) => const LoginScreen(),
      register: (ctx) => const RegisterScreen(),

      // Admin
      adminDashboard: (ctx) => const AdminDashboardScreen(),

      // User
      onboarding: (ctx) => const OnboardingScreen(),
      home: (ctx) => const MainShell(),
      artisan: (ctx) => const ArtisanShell(),
      productDetails: (ctx) => const ProductDetailsScreen(),
      addProduct: (ctx) => const AddProductScreen(),
      myStore: (ctx) => const ArtisanProductsScreen(),
      artisanRequests: (ctx) => const ArtisanRequestsScreen(),
      cart: (ctx) => const CartScreen(),
      orders: (ctx) => const OrdersScreen(),
      orderDetails: (ctx) => const OrderDetailsScreen(),
      checkout: (ctx) => const CheckoutScreen(),
      orderConfirmation: (ctx) => const OrderConfirmationScreen(),
      reviews: (ctx) => const ReviewsScreen(),
      favorites: (ctx) => const FavoritesScreen(),
      profile: (ctx) => const ProfileScreen(),
      search: (ctx) => const SearchScreen(),
      customOrder: (ctx) => const CustomOrderScreen(),
      customOrdersList: (ctx) => const CustomOrdersListScreen(),
      proposals: (ctx) => const BuyerProposalsScreen(),
      workshops: (ctx) => const WorkshopsScreen(),
      cultural: (ctx) => const CulturalScreen(),
      logistics: (ctx) => const LogisticsScreen(),
      settings: (ctx) => const SettingsScreen(),
      chat: (ctx) => const ChatScreen(),
      inbox: (ctx) => const ConversationsScreen(),
      artisanDirectory: (ctx) => const ArtisanDirectoryScreen(),
      notifications: (ctx) => const NotificationsScreen(),
    };
  }
}
