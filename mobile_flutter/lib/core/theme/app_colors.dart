import 'package:flutter/material.dart';

/// Premium gold & black color palette for the Curio platform.
class AppColors {
  // ── Brand core ────────────────────────────────────────────────────
  static const Color primary = Color(0xFFD4AF37);      // Luxury gold
  static const Color primaryDark = Color(0xFFB8960C);   // Deep gold
  static const Color primaryLight = Color(0xFFE8D5A8);  // Light gold
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFF0E1B9);

  // ── Backgrounds ───────────────────────────────────────────────────
  static const Color background = Color(0xFF121212);    // Dark gray BG
  static const Color surface = Color(0xFF1E1E1E);        // Card surface
  static const Color surfaceLight = Color(0xFF2A2A2A);   // Elevated surface
  static const Color surfaceAccent = Color(0xFF22201C);  // Gold-tinted surface

  // ── Text ──────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9E9E9E);
  static const Color textMuted = Color(0xFF616161);

  // ── Borders & Dividers ────────────────────────────────────────────
  static const Color divider = Color(0xFF2A2A2A);
  static const Color border = Color(0xFF333333);
  static const Color borderGold = Color(0x33D4AF37);    // 20% gold border

  // ── Status ────────────────────────────────────────────────────────
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFC107);
  static const Color error = Color(0xFFEF5350);
  static const Color info = Color(0xFF42A5F5);

  // ── Dark mode aliases (for existing code compatibility) ───────────
  static const Color dark = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2A2A2A);

  // ── Category accents ──────────────────────────────────────────────
  static const Color accentOrange = Color(0xFFE67E22);
  static const Color accentGreen = Color(0xFF27AE60);
  static const Color accentPurple = Color(0xFF8E44AD);
  static const Color accentBlue = Color(0xFF2980B9);

  // ── Admin accent ──────────────────────────────────────────────────
  static const Color adminAccent = Color(0xFFD4AF37); // gold for admin too
  static const Color adminPrimary = Color(0xFF0A0A0A);
  static const Color adminSurface = Color(0xFF141414);
}
