import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/local_storage/local_storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/market_provider.dart';
import 'providers/favorite_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/order_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';

// Screens
import 'features/splash/splash_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/admin/admin_screen.dart';
import 'features/admin/admin_users_screen.dart';
import 'features/admin/admin_verify_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/home/home_screen.dart';
import 'features/product/product_details_screen.dart';
import 'features/cart/cart_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/profile/favorites_screen.dart';
import 'features/search/search_screen.dart';
import 'features/orders/orders_screen.dart';
import 'features/reviews/reviews_screen.dart';
import 'features/custom_order/custom_order_screen.dart';
import 'features/workshops/workshops_screen.dart';
import 'features/cultural/cultural_screen.dart';
import 'features/logistics/logistics_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/artisan/artisan_screen.dart';
import 'features/chat/chat_screen.dart';
import 'features/notifications/notifications_screen.dart';

import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local storage and seed demo data on first run
  await LocalStorageService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => MarketProvider()),
        ChangeNotifierProvider(create: (_) => FavoriteProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: const CurioApp(),
    ),
  );
}

class CurioApp extends StatelessWidget {
  const CurioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Curio — Egyptian Artisan Marketplace',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      initialRoute: '/',
      navigatorKey: _navigatorKey,
      routes: {
        '/': (ctx) => const SplashScreen2(),
        // '/': (ctx) => const SplashScreen(),
        '/onboarding': (ctx) => const OnboardingScreen(),
        '/login': (ctx) => const LoginScreen(),
        '/register': (ctx) => const RegisterScreen(),
        '/artisan': (ctx) => const ArtisanScreen(),
        '/admin': (ctx) => const AdminScreen(),
        '/admin/users': (ctx) => const AdminUsersScreen(),
        '/admin/verify': (ctx) => const AdminVerifyScreen(),
        '/home': (ctx) => const HomeScreen(),
        '/product-details': (ctx) => const ProductDetailsScreen(),
        '/cart': (ctx) => const CartScreen(),
        '/favorites': (ctx) => const FavoritesScreen(),
        '/profile': (ctx) => const ProfileScreen(),
        '/search': (ctx) => const SearchScreen(),
        '/orders': (ctx) => const OrdersScreen(),
        '/reviews': (ctx) => const ReviewsScreen(),
        '/custom-order': (ctx) => const CustomOrderScreen(),
        '/workshops': (ctx) => const WorkshopsScreen(),
        '/cultural': (ctx) => const CulturalScreen(),
        '/logistics': (ctx) => const LogisticsScreen(),
        '/settings': (ctx) => const SettingsScreen(),
        '/chat': (ctx) => const ChatScreen(),
        '/notifications': (ctx) => const NotificationsScreen(),
      },
    );
  }

  static final GlobalKey<NavigatorState> _navigatorKey =
      GlobalKey<NavigatorState>();
}
