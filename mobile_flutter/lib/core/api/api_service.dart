import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'api_config.dart';

/// Thin REST wrapper — every call returns decoded JSON or throws [ApiException].
class ApiService {
  static final _client = http.Client();
  static final _timeout = Duration(seconds: ApiConfig.timeoutSeconds);

  // ── Helpers ───────────────────────────────────────────────────────

  static Uri _uri(String path, [Map<String, String>? queryParams]) {
    final base = Uri.parse(ApiConfig.baseUrl);
    return base.replace(
      path: '${base.path}$path',
      queryParameters: queryParams,
    );
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  static dynamic _handleResponse(http.Response res) {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }
    final message = body is Map ? (body['message'] ?? 'Unknown error') : 'Server error';
    throw ApiException(message.toString(), res.statusCode);
  }

  // ── Public HTTP methods ───────────────────────────────────────────

  static Future<dynamic> get(String path, {Map<String, String>? query}) async {
    try {
      final res = await _client.get(_uri(path, query), headers: _headers).timeout(_timeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Connection timed out. Check your internet.', 0);
    } on SocketException {
      throw ApiException('Cannot reach server. Is the backend running?', 0);
    }
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body, Map<String, String>? query}) async {
    try {
      final res = await _client
          .post(_uri(path, query), headers: _headers, body: body != null ? jsonEncode(body) : null)
          .timeout(_timeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Connection timed out.', 0);
    } on SocketException {
      throw ApiException('Cannot reach server.', 0);
    }
  }

  static Future<dynamic> put(String path, {Map<String, dynamic>? body, Map<String, String>? query}) async {
    try {
      final res = await _client
          .put(_uri(path, query), headers: _headers, body: body != null ? jsonEncode(body) : null)
          .timeout(_timeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Connection timed out.', 0);
    } on SocketException {
      throw ApiException('Cannot reach server.', 0);
    }
  }

  static Future<dynamic> delete(String path, {Map<String, String>? query}) async {
    try {
      final res = await _client.delete(_uri(path, query), headers: _headers).timeout(_timeout);
      return _handleResponse(res);
    } on TimeoutException {
      throw ApiException('Connection timed out.', 0);
    } on SocketException {
      throw ApiException('Cannot reach server.', 0);
    }
  }
}

/// Custom exception thrown by [ApiService].
class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
