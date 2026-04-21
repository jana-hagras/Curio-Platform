import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FavoriteProvider extends ChangeNotifier {
  static const _key = 'favorites_list';
  List<String> _favorites = [];

  List<String> get favorites => _favorites;

  FavoriteProvider() {
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    _favorites = prefs.getStringList(_key) ?? [];
    notifyListeners();
  }

  Future<void> toggleFavorite(String id) async {
    final prefs = await SharedPreferences.getInstance();
    if (_favorites.contains(id)) {
      _favorites.remove(id);
    } else {
      _favorites.add(id);
    }
    await prefs.setStringList(_key, _favorites);
    notifyListeners();
  }

  bool isFavorite(String id) {
    return _favorites.contains(id);
  }
}
