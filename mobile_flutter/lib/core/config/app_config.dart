/// Defines the two app flavors and holds per-flavor configuration.
enum AppFlavor { user, admin }

class AppConfig {
  static late AppFlavor flavor;

  static String get appName {
    switch (flavor) {
      case AppFlavor.user:
        return 'Curio — Egyptian Artisan Marketplace';
      case AppFlavor.admin:
        return 'Curio Admin';
    }
  }

  static String get initialRoute {
    switch (flavor) {
      case AppFlavor.user:
        return '/';
      case AppFlavor.admin:
        return '/admin/dashboard';
    }
  }

  static bool get isUser => flavor == AppFlavor.user;
  static bool get isAdmin => flavor == AppFlavor.admin;
}
