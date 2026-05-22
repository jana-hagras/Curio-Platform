import 'package:curio_app/core/local_storage/local_storage_service.dart';
import 'package:curio_app/main.dart';
import 'package:curio_app/providers/auth_provider.dart';
import 'package:curio_app/providers/cart_provider.dart';
import 'package:curio_app/providers/chat_provider.dart';
import 'package:curio_app/providers/favorite_provider.dart';
import 'package:curio_app/providers/market_provider.dart';
import 'package:curio_app/providers/notification_provider.dart';
import 'package:curio_app/providers/order_provider.dart';
import 'package:curio_app/providers/proposals_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Curio app boots to the splash route', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => MarketProvider()),
          ChangeNotifierProvider(create: (_) => FavoriteProvider()),
          ChangeNotifierProvider(create: (_) => CartProvider()),
          ChangeNotifierProvider(create: (_) => OrderProvider()),
          ChangeNotifierProvider(create: (_) => ChatProvider()),
          ChangeNotifierProvider(create: (_) => NotificationProvider()),
          ChangeNotifierProvider(create: (_) => ProposalsProvider()),
        ],
        child: const CurioApp(),
      ),
    );

    await tester.pump(const Duration(seconds: 4));

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
