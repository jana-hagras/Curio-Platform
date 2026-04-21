import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  String? get error => _error;

  /// Try to auto-login from saved session.
  Future<void> tryAutoLogin() async {
    final userId = LocalStorageService.loadInt(StorageKeys.currentUserId);
    if (userId == null) return;

    final users = LocalStorageService.loadList(StorageKeys.users);
    final match = users.where((u) => u['id'] == userId).toList();
    if (match.isNotEmpty) {
      _user = UserModel.fromJson(match.first);
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    // Simulate a brief loading delay
    await Future.delayed(const Duration(milliseconds: 500));

    try {
      final users = LocalStorageService.loadList(StorageKeys.users);
      final match = users.where((u) =>
          u['email']?.toString().toLowerCase() == email.toLowerCase() &&
          u['password'] == password).toList();

      if (match.isEmpty) {
        _error = 'Invalid email or password';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final userData = match.first;

      if (userData['isBanned'] == true) {
        _error = 'This account has been banned. Contact support.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _user = UserModel.fromJson(userData);
      await LocalStorageService.saveInt(StorageKeys.currentUserId, _user!.id);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Login failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fName,
    required String lName,
    required String email,
    required String password,
    required String type,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 500));

    try {
      final users = LocalStorageService.loadList(StorageKeys.users);

      // Check if email already exists
      final exists = users.any((u) =>
          u['email']?.toString().toLowerCase() == email.toLowerCase());
      if (exists) {
        _error = 'Email already registered';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final newId = LocalStorageService.getNextId(StorageKeys.users);
      final now = DateTime.now();

      final newUser = {
        'id': newId,
        'firstName': fName,
        'middleName': null,
        'lastName': lName,
        'email': email,
        'password': password,
        'phone': null,
        'address': null,
        'type': type,
        'profileImage': '',
        'joinDate': '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
        'country': null,
        'bio': type == 'Artisan' ? '' : null,
        'status': 'Active',
        'verified': type == 'Artisan' ? false : true,
        'isBanned': false,
      };

      users.add(newUser);
      await LocalStorageService.saveList(StorageKeys.users, users);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Registration failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    await LocalStorageService.clearSession();
    notifyListeners();
  }

  void updateUser(UserModel newUser) {
    _user = newUser;
    // Also update in local storage
    final users = LocalStorageService.loadList(StorageKeys.users);
    final index = users.indexWhere((u) => u['id'] == newUser.id);
    if (index != -1) {
      users[index] = newUser.toJson();
      LocalStorageService.saveList(StorageKeys.users, users);
    }
    notifyListeners();
  }
}
