import 'package:flutter/material.dart';

/// Premium gold & black color palette for the Curio platform.
/// Colors aligned with frontend CSS custom properties (index.css).
class AppColors {
  // ── Brand core (matches --gold-primary / --gold-light / --gold-dark) ──
  static const Color primary = Color(0xFFD4A843);
  static const Color primaryDark = Color(0xFFB8912A);
  static const Color primaryLight = Color(0xFFE0BC5E);
  static const Color primaryLighter = Color(0xFFF0D98A);
  static const Color gold = Color(0xFFD4A843);
  static const Color goldLight = Color(0xFFE0BC5E);

  // ── Light-mode surfaces (matches frontend light theme) ────────────
  static const Color backgroundLight = Color(0xFFF7F7F5);   // --surface-secondary
  static const Color surfaceLight = Color(0xFFFFFFFF);        // --surface-primary
  static const Color surfaceTertiaryLight = Color(0xFFEDEBE8); // --surface-tertiary
  static const Color borderLight = Color(0xFFE0DCD5);        // --surface-border
  static const Color creamLight = Color(0xFFFDF8F0);         // --cream
  static const Color textPrimaryLight = Color(0xFF0A0A0A);   // --text-primary
  static const Color textSecondaryLight = Color(0xFF6B6B6B); // --text-secondary
  static const Color textTertiaryLight = Color(0xFF9CA3AF);  // --text-tertiary

  // ── Dark-mode surfaces (matches frontend [data-theme="dark"]) ─────
  static const Color background = Color(0xFF121212);
  static const Color surface = Color(0xFF1E1E1E);
  static const Color surfaceElevated = Color(0xFF2A2A2A);
  static const Color surfaceAccent = Color(0xFF22201C);
  static const Color borderDark = Color(0xFF333333);

  // ── Text (dark mode) ──────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9E9E9E);
  static const Color textMuted = Color(0xFF616161);

  // ── Borders & Dividers ────────────────────────────────────────────
  static const Color divider = Color(0xFF2A2A2A);
  static const Color border = Color(0xFF333333);
  static const Color borderGold = Color(0x33D4A843);    // 20% gold border

  // ── Status (matches frontend --success / --error / --warning / --info) ─
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFDBEAFE);

  // ── Dark mode aliases (backward compat) ───────────────────────────
  static const Color dark = Color(0xFF0A0A0A);          // --black-deep
  static const Color darkMid = Color(0xFF111111);        // --black-mid
  static const Color darkSoft = Color(0xFF1A1A1A);       // --black-soft
  static const Color darkCard = Color(0xFF2A2A2A);

  // ── Shadows ────────────────────────────────────────────────────────
  static const Color shadowGold = Color(0x4DD4A843);     // 30% gold
  static const Color shadowGoldLg = Color(0x66D4A843);   // 40% gold

  // ── Category accents ──────────────────────────────────────────────
  static const Color accentOrange = Color(0xFFE67E22);
  static const Color accentGreen = Color(0xFF27AE60);
  static const Color accentPurple = Color(0xFF8E44AD);
  static const Color accentBlue = Color(0xFF2980B9);

  // ── Admin accent ──────────────────────────────────────────────────
  static const Color adminAccent = Color(0xFFD4A843);
  static const Color adminPrimary = Color(0xFF0A0A0A);
  static const Color adminSurface = Color(0xFF141414);
}
