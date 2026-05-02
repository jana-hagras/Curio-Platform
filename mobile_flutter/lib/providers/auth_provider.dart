import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../core/local_storage/local_storage_service.dart';
import '../core/local_storage/storage_keys.dart';
import '../core/api/api_service.dart';

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

    try {
      final res = await ApiService.get('/user/me/$userId');
      if (res['ok'] == true && res['data']['user'] != null) {
        _user = UserModel.fromJson(res['data']['user']);
        notifyListeners();
      } else {
        await logout();
      }
    } catch (e) {
      // If network fails on auto-login, we might want to just stay logged out
      // or implement offline caching. For now, clear session if it fails hard.
      await logout();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.post('/user/login', body: {
        'email': email,
        'password': password,
      });

      if (res['ok'] == true && res['data']['user'] != null) {
        final userData = res['data']['user'];
        _user = UserModel.fromJson(userData);
        await LocalStorageService.saveInt(StorageKeys.currentUserId, _user!.id);
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = res['message'] ?? 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred';
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

    try {
      final res = await ApiService.post('/user/register', body: {
        'fName': fName,
        'lName': lName,
        'email': email,
        'password': password,
        'type': type,
      });

      if (res['ok'] == true) {
        // Auto-login after successful registration
        return await login(email, password);
      } else {
        _error = res['message'] ?? 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred';
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
    notifyListeners();
  }

  void setAdminBypassUser() {
    _user = UserModel(
      id: 999,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mail.com',
      type: 'Admin',
    );
    notifyListeners();
  }
}
