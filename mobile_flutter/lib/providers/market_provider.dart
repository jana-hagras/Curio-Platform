import 'package:flutter/material.dart';
import '../models/market_item_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class MarketProvider extends ChangeNotifier {
  List<MarketItemModel> _items = [];
  bool _isLoading = false;

  List<MarketItemModel> get items => _items;
  bool get isLoading => _isLoading;

  /// Load all items from local storage with a shimmer delay.
  Future<void> fetchItems() async {
    _isLoading = true;
    notifyListeners();

    // Brief shimmer loading effect
    await Future.delayed(const Duration(milliseconds: 800));

    try {
      final data = LocalStorageService.loadList(StorageKeys.marketItems);
      _items = data.map((j) => MarketItemModel.fromJson(j)).toList();
    } catch (e) {
      debugPrint('Failed to load items: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Search items locally by name or category.
  Future<void> searchItems(String query) async {
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 300));

    try {
      final data = LocalStorageService.loadList(StorageKeys.marketItems);
      final all = data.map((j) => MarketItemModel.fromJson(j)).toList();
      final lowerQuery = query.toLowerCase();
      _items = all.where((item) =>
          item.item.toLowerCase().contains(lowerQuery) ||
          (item.category?.toLowerCase().contains(lowerQuery) ?? false) ||
          (item.description?.toLowerCase().contains(lowerQuery) ?? false) ||
          (item.artisanName?.toLowerCase().contains(lowerQuery) ?? false)
      ).toList();
    } catch (e) {
      debugPrint('Search failed: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Filter by category.
  Future<void> filterByCategory(String category) async {
    if (category == 'All') {
      await fetchItems();
      return;
    }
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 300));

    try {
      final data = LocalStorageService.loadList(StorageKeys.marketItems);
      final all = data.map((j) => MarketItemModel.fromJson(j)).toList();
      _items = all.where((item) =>
          item.category?.toLowerCase() == category.toLowerCase()
      ).toList();
    } catch (e) {
      debugPrint('Filter failed: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Add a new item (used by artisan). Dynamic view: appears for all users.
  Future<void> addItem(MarketItemModel item) async {
    final data = LocalStorageService.loadList(StorageKeys.marketItems);
    data.add(item.toJson());
    await LocalStorageService.saveList(StorageKeys.marketItems, data);
    _items.add(item);
    notifyListeners();
  }

  /// Get item by ID.
  MarketItemModel? getItemById(int id) {
    try {
      return _items.firstWhere((i) => i.id == id);
    } catch (_) {
      // Try loading from storage if not in memory
      final data = LocalStorageService.loadList(StorageKeys.marketItems);
      final match = data.where((j) => j['id'] == id).toList();
      if (match.isNotEmpty) return MarketItemModel.fromJson(match.first);
      return null;
    }
  }
}
