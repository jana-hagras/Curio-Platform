/// Base URL and other API configuration constants.
class ApiConfig {
  /// Backend base URL — change this to your production/staging URL.
  /// For Android emulator use 10.0.2.2 instead of localhost.
  static const String baseUrl = 'http://10.0.2.2:3000';

  /// Connection / read timeout in seconds.
  static const int timeoutSeconds = 15;
}
