class AppConfig {
  // Single flavor configuration (User)
  static const String appName = 'Curio — Egyptian Artisan Marketplace';
  static const String initialRoute = '/';

  // Helper getters for compatibility
  static bool get isUser => true;
  static bool get isAdmin => false;
}
