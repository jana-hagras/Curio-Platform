import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import 'storage_keys.dart';

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
        0,
        (prev, item) =>
            (item['id'] as int? ?? 0) > prev ? item['id'] as int : prev);
    return maxId + 1;
  }

  /// Clear session (used on logout).
  static Future<void> clearSession() async {
    await _prefs?.remove('currentUserId');
  }

  // ─── First-run seed data ────────────────────────────────────────────

  static Future<void> _seedIfFirstRun() async {
    await _seedUsers();
    await _seedMarketItems();
    await _seedNotifications();

    if (loadList('cartItems').isEmpty) {
      await saveList('cartItems', []);
    }

    await _seedOrders();
    await _seedCustomOrders();
    await _seedProposals();
    await _seedWorkshops();
    await _seedMentorships();
    if (loadList(StorageKeys.programEnrollments).isEmpty) {
      await saveList(StorageKeys.programEnrollments, []);
    }
    await _seedChatMessages();
  }

  static Future<void> _seedUsers() async {
    final users = loadList('users');
    final demoUsers = [
      {
        'id': 1,
        'firstName': 'Jana',
        'middleName': null,
        'lastName': 'Hagras',
        'email': 'jana@curio.com',
        'password': 'password123',
        'phone': '+201234567890',
        'address': 'Cairo, Egypt',
        'type': 'Artisan',
        'profileImage':
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        'joinDate': '2025-01-15',
        'country': 'Egypt',
        'bio':
            'Ceramic and mixed-media artisan inspired by Egyptian heritage and contemporary form.',
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 2,
        'firstName': 'Anas',
        'middleName': null,
        'lastName': 'Mohammed',
        'email': 'anas@curio.com',
        'password': 'password123',
        'phone': '+201098765432',
        'address': 'Luxor, Egypt',
        'type': 'Buyer',
        'profileImage':
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        'joinDate': '2024-11-20',
        'country': 'Egypt',
        'bio': null,
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 3,
        'firstName': 'Super',
        'middleName': null,
        'lastName': 'Admin',
        'email': 'admin@curio.com',
        'password': 'Admin123!',
        'phone': null,
        'address': null,
        'type': 'Admin',
        'profileImage':
            'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80',
        'joinDate': '2024-01-01',
        'country': 'Egypt',
        'bio': null,
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 4,
        'firstName': 'Youssef',
        'middleName': null,
        'lastName': 'Ahmed',
        'email': 'youssef@curio.com',
        'password': 'password123',
        'phone': '+201055566677',
        'address': 'Aswan, Egypt',
        'type': 'Artisan',
        'profileImage':
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        'joinDate': '2025-02-08',
        'country': 'Egypt',
        'bio':
            'Textile and leather artisan creating bold, detail-rich pieces rooted in local craft.',
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 5,
        'firstName': 'Adham',
        'middleName': null,
        'lastName': 'Baher',
        'email': 'adham@curio.com',
        'password': 'password123',
        'phone': '+201066677788',
        'address': 'Alexandria, Egypt',
        'type': 'Artisan',
        'profileImage':
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        'joinDate': '2025-03-12',
        'country': 'Egypt',
        'bio':
            'Jewelry and metalwork artisan focused on clean geometry and refined finishes.',
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
      {
        'id': 6,
        'firstName': 'Ahmed',
        'middleName': null,
        'lastName': 'Abdelrehim',
        'email': 'ahmed@curio.com',
        'password': 'password123',
        'phone': '+201011122233',
        'address': 'Giza, Egypt',
        'type': 'Buyer',
        'profileImage':
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        'joinDate': '2025-04-04',
        'country': 'Egypt',
        'bio': null,
        'status': 'Active',
        'verified': true,
        'isBanned': false,
      },
    ];

    final mergedUsers = _upsertManyByKey(users, demoUsers, 'email');
    await saveList('users', mergedUsers);
  }

  static Future<void> _seedMarketItems() async {
    final items = loadList('marketItems');
    final demoItems = [
      {
        'id': 1,
        'item': 'Pharaonic Ceramic Vase',
        'price': 350.0,
        'description':
            'Hand-painted ceramic vase inspired by ancient Pharaonic art motifs.',
        'image':
            'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80',
        'category': 'Pottery',
        'artisanId': 1,
        'artisanName': 'Jana Hagras',
        'availQuantity': 8,
        'rating': 4.8,
        'reviewCount': 24,
      },
      {
        'id': 2,
        'item': 'Handwoven Siwa Carpet',
        'price': 1200.0,
        'description':
            'Traditional Berber-style carpet handwoven by Siwa artisans using natural dyes.',
        'image':
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=80',
        'category': 'Textiles',
        'artisanId': 4,
        'artisanName': 'Youssef Ahmed',
        'availQuantity': 3,
        'rating': 4.9,
        'reviewCount': 18,
      },
      {
        'id': 3,
        'item': 'Silver Ankh Pendant',
        'price': 180.0,
        'description':
            'Sterling silver pendant shaped as the ancient Egyptian Ankh symbol.',
        'image':
            'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80',
        'category': 'Jewelry',
        'artisanId': 5,
        'artisanName': 'Adham Baher',
        'availQuantity': 15,
        'rating': 4.7,
        'reviewCount': 31,
      },
      {
        'id': 4,
        'item': 'Lotus Flower Lamp',
        'price': 450.0,
        'description':
            'Handcrafted brass table lamp with a lotus blossom shade.',
        'image':
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
        'category': 'Decor',
        'artisanId': 1,
        'artisanName': 'Jana Hagras',
        'availQuantity': 5,
        'rating': 4.6,
        'reviewCount': 12,
      },
      {
        'id': 5,
        'item': 'Nubian Clay Bowl Set',
        'price': 280.0,
        'description':
            'Set of 3 hand-formed clay bowls with Nubian geometric patterns.',
        'image':
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80',
        'category': 'Pottery',
        'artisanId': 4,
        'artisanName': 'Youssef Ahmed',
        'availQuantity': 10,
        'rating': 4.5,
        'reviewCount': 9,
      },
      {
        'id': 6,
        'item': 'Embroidered Khayamiya Panel',
        'price': 650.0,
        'description':
            'Vibrant tent-making appliqué panel from the historic tentmakers\' alley in Cairo.',
        'image':
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
        'category': 'Textiles',
        'artisanId': 5,
        'artisanName': 'Adham Baher',
        'availQuantity': 4,
        'rating': 4.9,
        'reviewCount': 15,
      },
    ];

    final mergedItems = _upsertManyByKey(items, demoItems, 'item');
    await saveList('marketItems', mergedItems);
  }

  static Future<void> _seedNotifications() async {
    final notifications = loadList('notifications');
    final demoNotifications = [
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
      {
        'id': '3',
        'title': 'Order Delivered',
        'body': 'ORD-1001 has been delivered successfully.',
        'icon': 'local_shipping',
        'color': 'success',
        'time': '1d ago',
        'isRead': false,
      },
      {
        'id': '4',
        'title': 'Custom Request Updated',
        'body': 'Your bespoke request is now being prepared by an artisan.',
        'icon': 'auto_fix_high',
        'color': 'warning',
        'time': '3d ago',
        'isRead': false,
      },
    ];

    final mergedNotifications = _upsertManyByKey(
      notifications,
      demoNotifications,
      'title',
    );
    await saveList('notifications', mergedNotifications);
  }

  static Future<void> _seedOrders() async {
    final orders = loadList('orders');
    final demoOrders = [
      {
        'id': 1,
        'orderId': 'ORD-1001',
        'buyerId': 2,
        'buyerName': 'Anas Mohammed',
        'artisanId': 1,
        'orderDate': '2026-05-12',
        'deliveryAddress': 'Luxor, Egypt',
        'status': 'Delivered',
        'totalAmount': 800.0,
        'items': [
          {
            'productId': 1,
            'name': 'Pharaonic Ceramic Vase',
            'price': 350.0,
            'quantity': 1,
            'image':
                'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80',
          },
          {
            'productId': 4,
            'name': 'Lotus Flower Lamp',
            'price': 450.0,
            'quantity': 1,
            'image':
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
          },
        ],
      },
      {
        'id': 2,
        'orderId': 'ORD-1002',
        'buyerId': 6,
        'buyerName': 'Ahmed Abdelrehim',
        'artisanId': 4,
        'orderDate': '2026-05-14',
        'deliveryAddress': 'Giza, Egypt',
        'status': 'In Transit',
        'totalAmount': 560.0,
        'items': [
          {
            'productId': 5,
            'name': 'Nubian Clay Bowl Set',
            'price': 280.0,
            'quantity': 2,
            'image':
                'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80',
          },
        ],
      },
      {
        'id': 3,
        'orderId': 'ORD-1003',
        'buyerId': 2,
        'buyerName': 'Anas Mohammed',
        'artisanId': 5,
        'orderDate': '2026-05-18',
        'deliveryAddress': 'Luxor, Egypt',
        'status': 'Processing',
        'totalAmount': 830.0,
        'items': [
          {
            'productId': 3,
            'name': 'Silver Ankh Pendant',
            'price': 180.0,
            'quantity': 1,
            'image':
                'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80',
          },
          {
            'productId': 6,
            'name': 'Embroidered Khayamiya Panel',
            'price': 650.0,
            'quantity': 1,
            'image':
                'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
          },
        ],
      },
      {
        'id': 4,
        'orderId': 'ORD-1004',
        'buyerId': 6,
        'buyerName': 'Ahmed Abdelrehim',
        'artisanId': 1,
        'orderDate': '2026-05-20',
        'deliveryAddress': 'Giza, Egypt',
        'status': 'Completed',
        'totalAmount': 350.0,
        'items': [
          {
            'productId': 1,
            'name': 'Pharaonic Ceramic Vase',
            'price': 350.0,
            'quantity': 1,
            'image':
                'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80',
          },
        ],
      },
    ];

    final mergedOrders = _upsertManyByKey(orders, demoOrders, 'orderId');
    await saveList('orders', mergedOrders);
  }

  static Future<void> _seedCustomOrders() async {
    final customOrders = loadList('customOrders');
    final demoCustomOrders = [
      {
        'id': 1,
        'buyerId': 2,
        'buyerName': 'Anas Mohammed',
        'artisanId': 1,
        'category': 'Pottery',
        'description':
            'A hand-painted vase in deep blue and gold with lotus and ankh details for a hallway console.',
        'budget': 900.0,
        'deadline': '2026-06-05',
        'status': 'In Progress',
        'dateSubmitted': '2026-05-15',
      },
      {
        'id': 2,
        'buyerId': 6,
        'buyerName': 'Ahmed Abdelrehim',
        'artisanId': 4,
        'category': 'Textiles',
        'description':
            'A premium wall hanging using Nubian geometry and warm desert tones for a living room feature wall.',
        'budget': 1500.0,
        'deadline': '2026-06-12',
        'status': 'Pending',
        'dateSubmitted': '2026-05-17',
      },
      {
        'id': 3,
        'buyerId': 2,
        'buyerName': 'Anas Mohammed',
        'artisanId': 5,
        'category': 'Jewelry',
        'description':
            'A custom silver pendant inspired by the Nile with minimalist engraving and a matte finish.',
        'budget': 650.0,
        'deadline': '2026-05-30',
        'status': 'Completed',
        'dateSubmitted': '2026-05-09',
      },
      {
        'id': 4,
        'buyerId': 6,
        'buyerName': 'Ahmed Abdelrehim',
        'artisanId': 1,
        'category': 'Decor',
        'description':
            'A brass table lamp with a lotus silhouette and soft warm lighting for a home office desk.',
        'budget': 1200.0,
        'deadline': '2026-06-20',
        'status': 'Pending',
        'dateSubmitted': '2026-05-20',
      },
    ];

    final mergedCustomOrders =
        _upsertManyByKey(customOrders, demoCustomOrders, 'id');
    await saveList('customOrders', mergedCustomOrders);
  }

  static Future<void> _seedProposals() async {
    final proposals = loadList('proposals');
    final demoProposals = [
      {
        'id': 1,
        'customOrderId': 1,
        'artisanId': 1,
        'buyerId': 2,
        'price': 850.0,
        'timeline': '2 weeks',
        'message': 'I can make this in 2 weeks with a hand-glaze finish.',
        'status': 'Sent',
        'timestamp': '2026-05-16T09:00:00.000',
      },
    ];

    final merged = _upsertManyByKey(proposals, demoProposals, 'id');
    await saveList('proposals', merged);
  }

  static Future<void> _seedWorkshops() async {
    final workshops = loadList('workshops');
    final demoWorkshops = [
      {
        'id': 1,
        'title': 'Pottery Basics: Wheel Throwing',
        'description':
            'Learn the fundamentals of wheel throwing with master artisan Sarah. Perfect for absolute beginners.',
        'image':
            'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80',
        'duration': '2 Hours',
        'mentor': 'Sarah Jenkins',
        'status': 'Approved',
      },
      {
        'id': 2,
        'title': 'Textile Weaving Masterclass',
        'description':
            'Discover the ancient art of loom weaving. Create your own patterned tapestry.',
        'image':
            'https://images.unsplash.com/photo-1605282715099-a864d2d46e3e?w=600&q=80',
        'duration': '3 Hours',
        'mentor': 'Elena R.',
        'status': 'Approved',
      },
      {
        'id': 3,
        'title': 'Jewelry Making: Silver Smithing',
        'description':
            'Craft your own silver ring from scratch. Includes materials and safety briefing.',
        'image':
            'https://images.unsplash.com/photo-1599643478524-fb467ce422c5?w=600&q=80',
        'duration': '4 Hours',
        'mentor': 'David Chen',
        'status': 'Approved',
      },
    ];

    final mergedWorkshops = _upsertManyByKey(workshops, demoWorkshops, 'id');
    await saveList('workshops', mergedWorkshops);
  }

  static Future<void> _seedMentorships() async {
    final mentorships = loadList('mentorships');
    final demoMentorships = [
      {
        'id': 1,
        'title': '1-on-1 Artisan Career Coaching',
        'description':
            'Get personalized advice on how to price your art, market yourself, and grow your local business.',
        'image':
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
        'duration': '45 Mins',
        'mentor': 'Michael T.',
        'status': 'Approved',
      },
      {
        'id': 2,
        'title': 'Digital Marketing for Crafters',
        'description':
            'Learn how to leverage social media and online platforms to sell your handmade goods.',
        'image':
            'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&q=80',
        'duration': '1 Hour',
        'mentor': 'Jessica W.',
        'status': 'Approved',
      },
    ];

    final mergedMentorships =
        _upsertManyByKey(mentorships, demoMentorships, 'id');
    await saveList('mentorships', mergedMentorships);
  }

  static Future<void> _seedChatMessages() async {
    final messages = loadList('chatMessages');
    final demoMessages = [
      {
        'id': 'chat-1001',
        'senderId': 2,
        'receiverId': 1,
        'message':
            'Hi Jana, I loved the vase on the shop page. Can you do a darker glaze?',
        'timestamp': '2026-05-15T10:20:00.000',
        'isMe': false,
      },
      {
        'id': 'chat-1002',
        'senderId': 1,
        'receiverId': 2,
        'message':
            'Absolutely. I can prepare a blue-black glaze with gold highlights.',
        'timestamp': '2026-05-15T10:24:00.000',
        'isMe': true,
      },
      {
        'id': 'chat-1003',
        'senderId': 6,
        'receiverId': 4,
        'message':
            'Youssef, I need a woven piece for a living room wall. Do you take custom sizes?',
        'timestamp': '2026-05-17T08:15:00.000',
        'isMe': false,
      },
      {
        'id': 'chat-1004',
        'senderId': 4,
        'receiverId': 6,
        'message':
            'Yes, I can make it to size and share color options before production.',
        'timestamp': '2026-05-17T08:19:00.000',
        'isMe': true,
      },
      {
        'id': 'chat-1005',
        'senderId': 2,
        'receiverId': 5,
        'message':
            'Adham, would you make the pendant with a brushed finish instead of polished?',
        'timestamp': '2026-05-18T16:40:00.000',
        'isMe': false,
      },
      {
        'id': 'chat-1006',
        'senderId': 5,
        'receiverId': 2,
        'message':
            'Yes, brushed finish works well. I can also add a more minimal engraving if you want.',
        'timestamp': '2026-05-18T16:45:00.000',
        'isMe': true,
      },
    ];

    final mergedMessages = _upsertManyByKey(messages, demoMessages, 'id');
    await saveList('chatMessages', mergedMessages);
  }

  static List<Map<String, dynamic>> _upsertManyByKey(
    List<Map<String, dynamic>> existing,
    List<Map<String, dynamic>> seeded,
    String uniqueKey,
  ) {
    final merged = <Map<String, dynamic>>[];
    final seen = <String>{};

    for (final item in existing) {
      final keyValue = item[uniqueKey]?.toString();
      if (keyValue == null) {
        merged.add(Map<String, dynamic>.from(item));
        continue;
      }

      final seedMatch = seeded.cast<Map<String, dynamic>?>().firstWhere(
            (seed) => seed?[uniqueKey]?.toString() == keyValue,
            orElse: () => null,
          );

      if (seedMatch != null) {
        merged.add({...item, ...seedMatch});
        seen.add(keyValue);
      } else {
        merged.add(Map<String, dynamic>.from(item));
      }
    }

    for (final item in seeded) {
      final keyValue = item[uniqueKey]?.toString();
      if (keyValue == null || seen.contains(keyValue)) continue;
      merged.add(Map<String, dynamic>.from(item));
    }

    return merged;
  }
}
