import 'package:flutter/material.dart';
import '../models/cart_item_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class CartProvider extends ChangeNotifier {
  List<CartItemModel> _items = [];

  List<CartItemModel> get items => _items;
  int get itemCount => _items.length;
  double get subtotal => _items.fold(0, (sum, item) => sum + item.total);
  double get deliveryFee => _items.isEmpty ? 0 : 50.0;
  double get total => subtotal + deliveryFee;

  CartProvider() {
    _loadCart();
  }

  Future<void> _loadCart() async {
    final data = LocalStorageService.loadList(StorageKeys.cartItems);
    _items = data.map((j) => CartItemModel.fromJson(j)).toList();
    notifyListeners();
  }

  Future<void> _saveCart() async {
    final data = _items.map((i) => i.toJson()).toList();
    await LocalStorageService.saveList(StorageKeys.cartItems, data);
  }

  Future<void> addToCart(CartItemModel item) async {
    final idx = _items.indexWhere((i) => i.productId == item.productId);
    if (idx >= 0) {
      _items[idx].quantity += 1;
    } else {
      _items.add(item);
    }
    await _saveCart();
    notifyListeners();
  }

  Future<void> removeFromCart(int productId) async {
    _items.removeWhere((i) => i.productId == productId);
    await _saveCart();
    notifyListeners();
  }

  Future<void> updateQuantity(int productId, int newQty) async {
    if (newQty <= 0) {
      await removeFromCart(productId);
      return;
    }
    final idx = _items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) {
      _items[idx].quantity = newQty;
      await _saveCart();
      notifyListeners();
    }
  }

  Future<void> clearCart() async {
    _items.clear();
    await _saveCart();
    notifyListeners();
  }

  bool isInCart(int productId) {
    return _items.any((i) => i.productId == productId);
  }
}
