import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'core/local_storage/local_storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/market_provider.dart';
import 'providers/notification_provider.dart';

/// Entry point for the **Admin** flavor.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.flavor = AppFlavor.admin;
  await LocalStorageService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => MarketProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: const CurioAdminApp(),
    ),
  );
}

class CurioAdminApp extends StatelessWidget {
  const CurioAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.adminTheme,
      themeMode: ThemeMode.dark,
      initialRoute: AppConfig.initialRoute,
      routes: AppRoutes.routes,
    );
  }
}
