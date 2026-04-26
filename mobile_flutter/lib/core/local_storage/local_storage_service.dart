import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper around SharedPreferences that the rest of the app uses for
/// persisting JSON lists and simple values.
class LocalStorageService {
  static SharedPreferences? _prefs;

  /// Must be called once before runApp (see main.dart).
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    await _seedIfFirstRun();
  }

  // ─── List helpers (JSON-encoded) ────────────────────────────────────

  /// Load a JSON-encoded list of maps.
  static List<Map<String, dynamic>> loadList(String key) {
    final raw = _prefs?.getString(key);
    if (raw == null || raw.isEmpty) return [];
    final decoded = jsonDecode(raw);
    if (decoded is List) {
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Save a list of maps as JSON.
  static Future<void> saveList(
      String key, List<Map<String, dynamic>> data) async {
    await _prefs?.setString(key, jsonEncode(data));
  }

  // ─── Scalar helpers ─────────────────────────────────────────────────

  static int? loadInt(String key) => _prefs?.getInt(key);

  static Future<void> saveInt(String key, int value) async {
    await _prefs?.setInt(key, value);
  }

  static String? loadString(String key) => _prefs?.getString(key);

  static Future<void> saveString(String key, String value) async {
    await _prefs?.setString(key, value);
  }

  // ─── Utility ────────────────────────────────────────────────────────

  /// Return the next auto-increment id for a given list key.
  static int getNextId(String key) {
    final list = loadList(key);
    if (list.isEmpty) return 1;
    final maxId = list.fold<int>(
        0, (prev, item) => (item['id'] as int? ?? 0) > prev ? item['id'] as int : prev);
    return maxId + 1;
  }

  /// Clear session (used on logout).
  static Future<void> clearSession() async {
    await _prefs?.remove('currentUserId');
  }

  // ─── First-run seed data ────────────────────────────────────────────

  static Future<void> _seedIfFirstRun() async {
    if (_prefs?.containsKey('users') == true) return;

    // Seed demo users
    await saveList('users', [
      {
        'id': 1,
        'firstName': 'Jana',
        'middleName': null,
        'lastName': 'Ahmed',
        'email': 'jana@test.com',
        'password': '123456',
        'phone': '+201234567890',
        'address': 'Cairo, Egypt',
        'type': 'Buyer',
        'profileImage': '',
        'joinDate': '2025-01-15',
        'country': 'Egypt',
        'bio': null,
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 2,
        'firstName': 'Amr',
        'middleName': null,
        'lastName': 'Hassan',
        'email': 'amr@test.com',
        'password': '123456',
        'phone': '+201098765432',
        'address': 'Luxor, Egypt',
        'type': 'Artisan',
        'profileImage': '',
        'joinDate': '2024-11-20',
        'country': 'Egypt',
        'bio': 'Master potter specializing in traditional Egyptian ceramics.',
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 3,
        'firstName': 'Admin',
        'middleName': null,
        'lastName': 'User',
        'email': 'admin@test.com',
        'password': 'admin123',
        'phone': null,
        'address': null,
        'type': 'Admin',
        'profileImage': '',
        'joinDate': '2024-01-01',
        'country': 'Egypt',
        'bio': null,
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
    ]);

    // Seed market items
    await saveList('marketItems', [
      {
        'id': 1,
        'item': 'Pharaonic Ceramic Vase',
        'price': 350.0,
        'description': 'Hand-painted ceramic vase inspired by ancient Pharaonic art motifs.',
        'image': '',
        'category': 'Pottery',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.8,
        'reviewCount': 24,
      },
      {
        'id': 2,
        'item': 'Handwoven Siwa Carpet',
        'price': 1200.0,
        'description': 'Traditional Berber-style carpet handwoven by Siwa artisans using natural dyes.',
        'image': '',
        'category': 'Textiles',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.9,
        'reviewCount': 18,
      },
      {
        'id': 3,
        'item': 'Silver Ankh Pendant',
        'price': 180.0,
        'description': 'Sterling silver pendant shaped as the ancient Egyptian Ankh symbol.',
        'image': '',
        'category': 'Jewelry',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.7,
        'reviewCount': 31,
      },
      {
        'id': 4,
        'item': 'Lotus Flower Lamp',
        'price': 450.0,
        'description': 'Handcrafted brass table lamp with a lotus blossom shade.',
        'image': '',
        'category': 'Decor',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.6,
        'reviewCount': 12,
      },
      {
        'id': 5,
        'item': 'Nubian Clay Bowl Set',
        'price': 280.0,
        'description': 'Set of 3 hand-formed clay bowls with Nubian geometric patterns.',
        'image': '',
        'category': 'Pottery',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.5,
        'reviewCount': 9,
      },
      {
        'id': 6,
        'item': 'Embroidered Khayamiya Panel',
        'price': 650.0,
        'description': 'Vibrant tent-making appliqué panel from the historic tentmakers\' alley in Cairo.',
        'image': '',
        'category': 'Textiles',
        'artisanId': 2,
        'artisanName': 'Amr Hassan',
        'rating': 4.9,
        'reviewCount': 15,
      },
    ]);

    // Seed notifications
    await saveList('notifications', [
      {
        'id': '1',
        'title': 'Welcome to Curio!',
        'body': 'Discover unique handmade crafts from Egyptian artisans.',
        'icon': 'auto_awesome',
        'color': 'primary',
        'time': 'Just now',
        'isRead': false,
      },
      {
        'id': '2',
        'title': 'New Collection Available',
        'body': 'Check out our latest pottery collection from Luxor.',
        'icon': 'notifications',
        'color': 'success',
        'time': '2h ago',
        'isRead': false,
      },
    ]);

    // Seed empty lists for other entities
    await saveList('cartItems', []);
    await saveList('orders', []);
    await saveList('customOrders', []);
    await saveList('chatMessages', []);
  }
}
