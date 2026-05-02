import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'core/local_storage/local_storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/market_provider.dart';
import 'providers/favorite_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/order_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';

/// Entry point for the **User** flavor (buyers + artisans).
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.flavor = AppFlavor.user;
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
      child: const CurioUserApp(),
    ),
  );
}

class CurioUserApp extends StatelessWidget {
  const CurioUserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      initialRoute: AppConfig.initialRoute,
      routes: AppRoutes.routes,
    );
  }
}
