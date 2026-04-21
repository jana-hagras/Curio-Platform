import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../models/cart_item_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class OrderProvider extends ChangeNotifier {
  List<OrderModel> _orders = [];
  bool _isLoading = false;

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;

  OrderProvider() {
    loadOrders();
  }

  Future<void> loadOrders() async {
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 300));

    final data = LocalStorageService.loadList(StorageKeys.orders);
    _orders = data.map((j) => OrderModel.fromJson(j)).toList();

    _isLoading = false;
    notifyListeners();
  }

  /// Get orders for a specific buyer.
  List<OrderModel> getOrdersForUser(int userId) {
    return _orders.where((o) => o.buyerId == userId).toList();
  }

  /// Place a new order from cart items.
  Future<OrderModel> placeOrder({
    required int buyerId,
    required String buyerName,
    required String deliveryAddress,
    required List<CartItemModel> cartItems,
  }) async {
    final data = LocalStorageService.loadList(StorageKeys.orders);
    final newId = LocalStorageService.getNextId(StorageKeys.orders);
    final now = DateTime.now();
    final orderId = 'ORD-${1000 + newId}';

    final orderJson = {
      'id': newId,
      'orderId': orderId,
      'buyerId': buyerId,
      'orderDate': '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
      'deliveryAddress': deliveryAddress,
      'status': 'Processing',
      'buyerName': buyerName,
      'items': cartItems.map((c) => c.toJson()).toList(),
    };

    data.add(orderJson);
    await LocalStorageService.saveList(StorageKeys.orders, data);

    final order = OrderModel.fromJson(orderJson);
    _orders.add(order);
    notifyListeners();
    return order;
  }

  /// Update order status.
  Future<void> updateStatus(int orderId, String newStatus) async {
    final data = LocalStorageService.loadList(StorageKeys.orders);
    final idx = data.indexWhere((o) => o['id'] == orderId);
    if (idx >= 0) {
      data[idx]['status'] = newStatus;
      await LocalStorageService.saveList(StorageKeys.orders, data);
      await loadOrders();
    }
  }
}
