import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';
// No remote API – using local storage mock

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  String? get error => _error;

  /// Try to auto‑login from saved session using the stored user id.
  Future<void> tryAutoLogin() async {
    final userId = LocalStorageService.loadInt(StorageKeys.currentUserId);
    if (userId == null) return;
    // Load the saved users list and find the matching record.
    final users = LocalStorageService.loadList('users');
    final index = users.indexWhere((e) => (e['id'] as int) == userId);
    if (index != -1) {
      _user = UserModel.fromJson(users[index]);
      notifyListeners();
    } else {
      await logout();
    }
  }

  /// Simulate login against locally stored users.
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    // Load users from local storage.
    final users = LocalStorageService.loadList('users');
    final index = users
        .indexWhere((e) => e['email'] == email && e['password'] == password);
    if (index != -1) {
      _user = UserModel.fromJson(users[index]);
      // Persist session.
      await LocalStorageService.saveInt(StorageKeys.currentUserId, _user!.id);
      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      _error = 'Invalid email or password';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Simulate user registration using local storage.
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

    // Ensure email is not already taken.
    final users = LocalStorageService.loadList('users');
    final exists = users.any((e) => e['email'] == email);
    if (exists) {
      _error = 'Email already in use';
      _isLoading = false;
      notifyListeners();
      return false;
    }

    // Create new user map.
    final newId = LocalStorageService.getNextId('users');
    final newUser = {
      'id': newId,
      'firstName': fName,
      'lastName': lName,
      'email': email,
      'password': password,
      'type': type,
      // optional fields can stay null / empty
    };
    users.add(newUser);
    await LocalStorageService.saveList('users', users);
    // Auto‑login the newly created user.
    return await login(email, password);
  }

  Future<void> logout() async {
    _user = null;
    await LocalStorageService.clearSession();
    notifyListeners();
  }

  Future<void> updateUser(UserModel newUser) async {
    _user = newUser;
    final users = LocalStorageService.loadList('users');
    final index = users.indexWhere((e) => (e['id'] as int?) == newUser.id);
    if (index != -1) {
      users[index] = newUser.toJson();
      await LocalStorageService.saveList('users', users);
    }
    notifyListeners();
  }

  void setAdminBypassUser() {
    _user = UserModel(
      id: 999,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@curio.com',
      password: 'Admin123!',
      type: 'Admin',
    );
    notifyListeners();
  }
}
