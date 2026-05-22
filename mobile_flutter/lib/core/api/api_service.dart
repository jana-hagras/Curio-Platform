import 'dart:async';
import '../local_storage/local_storage_service.dart';

/// Local mock API wrapper — replaces remote HTTP calls with LocalStorageService operations.
class ApiService {
  // ── Helpers ─────────────────────────────────────────────────────────────────

  /// Extracts query parameters from a URL path string like `/items?id=1&foo=bar`.
  /// Falls back to the explicit [query] map if provided.
  static Map<String, String> _mergeQuery(
      String path, Map<String, String>? query) {
    final merged = <String, String>{...?query};
    final qIndex = path.indexOf('?');
    if (qIndex != -1 && qIndex < path.length - 1) {
      final queryString = path.substring(qIndex + 1);
      for (final part in queryString.split('&')) {
        final eq = part.indexOf('=');
        if (eq > 0) {
          merged.putIfAbsent(
            Uri.decodeComponent(part.substring(0, eq)),
            () => Uri.decodeComponent(part.substring(eq + 1)),
          );
        }
      }
    }
    return merged;
  }

  /// Returns the path portion before any '?' query string.
  static String _basePath(String path) {
    final qIndex = path.indexOf('?');
    return qIndex != -1 ? path.substring(0, qIndex) : path;
  }

  // ── Public HTTP methods (Mocked) ───────────────────────────────────────────

  static Future<dynamic> get(String path, {Map<String, String>? query}) async {
    await Future.delayed(
        const Duration(milliseconds: 400)); // Simulate network latency

    try {
      if (path.startsWith('/user/all')) {
        final users = LocalStorageService.loadList('users');
        return {
          'ok': true,
          'data': {'users': users}
        };
      }

      if (path.startsWith('/market-items/all')) {
        final items = LocalStorageService.loadList('marketItems');
        return {
          'ok': true,
          'data': {'items': items}
        };
      }

      if (path.startsWith('/market-items/search')) {
        final items = LocalStorageService.loadList('marketItems');
        final q = query?['value']?.toLowerCase() ?? '';
        final filtered = items
            .where((i) => i['item'].toString().toLowerCase().contains(q))
            .toList();
        return {
          'ok': true,
          'data': {'items': filtered}
        };
      }

      if (path.startsWith('/orders/all')) {
        final orders = LocalStorageService.loadList('orders');
        return {
          'ok': true,
          'data': {'orders': orders}
        };
      }

      if (path.startsWith('/orders/artisan')) {
        final artisanId = query?['artisan_id'];
        final orders = LocalStorageService.loadList('orders');
        final filtered = orders
            .where((o) => o['artisanId'].toString() == artisanId)
            .toList();
        return {
          'ok': true,
          'data': {'orders': filtered}
        };
      }

      // Fallback
      return {'ok': true, 'data': {}};
    } catch (e) {
      throw ApiException('Mock API GET Error: $e', 500);
    }
  }

  static Future<dynamic> post(String path,
      {Map<String, dynamic>? body, Map<String, String>? query}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    try {
      if (path.startsWith('/market-items/')) {
        final items = LocalStorageService.loadList('marketItems');
        final newItem = {
          'id': LocalStorageService.getNextId('marketItems'),
          ...body ?? {},
        };
        items.add(newItem);
        await LocalStorageService.saveList('marketItems', items);
        return {'ok': true, 'data': newItem};
      }
      return {'ok': true, 'data': {}};
    } catch (e) {
      throw ApiException('Mock API POST Error: $e', 500);
    }
  }

  static Future<dynamic> put(String path,
      {Map<String, dynamic>? body, Map<String, String>? query}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    final base = _basePath(path);
    final q = _mergeQuery(path, query);
    try {
      if (base.startsWith('/user')) {
        final idStr = q['id'];
        if (idStr == null) {
          return {'ok': false, 'message': 'Missing user id'};
        }
        final id = int.tryParse(idStr);
        final users = LocalStorageService.loadList('users');
        final index = users.indexWhere((u) => u['id'] == id);
        if (index != -1) {
          users[index] = {...users[index], ...body ?? {}};
          await LocalStorageService.saveList('users', users);
          return {'ok': true, 'data': users[index]};
        }
      }
      if (base.startsWith('/market-items')) {
        final idStr = q['id'];
        if (idStr == null) {
          return {'ok': false, 'message': 'Missing market item id'};
        }
        final id = int.tryParse(idStr);
        final items = LocalStorageService.loadList('marketItems');
        final index = items.indexWhere((item) => item['id'] == id);
        if (index != -1) {
          items[index] = {...items[index], ...body ?? {}};
          await LocalStorageService.saveList('marketItems', items);
          return {'ok': true, 'data': items[index]};
        }
      }
      return {'ok': true, 'data': {}};
    } catch (e) {
      throw ApiException('Mock API PUT Error: $e', 500);
    }
  }

  static Future<dynamic> delete(String path,
      {Map<String, String>? query}) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final base = _basePath(path);
    final q = _mergeQuery(path, query);
    try {
      if (base.startsWith('/market-items')) {
        final idStr = q['id'];
        if (idStr == null) {
          return {'ok': false, 'message': 'Missing market item id'};
        }
        final id = int.tryParse(idStr);
        final items = LocalStorageService.loadList('marketItems');
        items.removeWhere((item) => item['id'] == id);
        await LocalStorageService.saveList('marketItems', items);
        return {'ok': true, 'data': {}};
      }
      return {'ok': true, 'data': {}};
    } catch (e) {
      throw ApiException('Mock API DELETE Error: $e', 500);
    }
  }
}

/// Custom exception thrown by [ApiService].
class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
