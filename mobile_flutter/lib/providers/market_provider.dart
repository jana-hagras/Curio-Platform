import 'package:flutter/material.dart';
import '../models/market_item_model.dart';
import '../core/api/api_service.dart';

class MarketProvider extends ChangeNotifier {
  List<MarketItemModel> _items = [];
  bool _isLoading = false;
  String? _error;

  List<MarketItemModel> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load all items from backend.
  Future<void> fetchItems() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.get('/market-items/all');
      if (res['ok'] == true) {
        final list = (res['data']['items'] as List?) ?? [];
        _items = list.map((j) => MarketItemModel.fromJson(Map<String, dynamic>.from(j))).toList();
      } else {
        _error = res['message'];
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Search items locally from the fetched list (or make a backend search call if preferred).
  Future<void> searchItems(String query) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get('/market-items/search?value=${Uri.encodeComponent(query)}');
      if (res['ok'] == true) {
        final list = (res['data']['items'] as List?) ?? [];
        _items = list.map((j) => MarketItemModel.fromJson(Map<String, dynamic>.from(j))).toList();
      }
    } catch (e) {
      _error = 'Search failed: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Filter by category (local filter for now as backend /all returns all).
  Future<void> filterByCategory(String category) async {
    if (category == 'All') {
      await fetchItems();
      return;
    }
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get('/market-items/all');
      if (res['ok'] == true) {
        final list = (res['data']['items'] as List?) ?? [];
        final all = list.map((j) => MarketItemModel.fromJson(Map<String, dynamic>.from(j))).toList();
        _items = all.where((item) =>
            item.category?.toLowerCase() == category.toLowerCase()
        ).toList();
      }
    } catch (e) {
      _error = 'Filter failed: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Add a new item
  Future<void> addItem(MarketItemModel item) async {
    // Note: Usually you'd call a POST endpoint here, e.g., /market-items
    // But for this frontend refactoring, we'll just add it to the local list if the backend endpoint is missing,
    // or you can call the backend if available.
    _items.add(item);
    notifyListeners();
  }

  /// Get item by ID.
  MarketItemModel? getItemById(int id) {
    try {
      return _items.firstWhere((i) => i.id == id);
    } catch (_) {
      return null;
    }
  }
}
