import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';

/// Centralized theme definitions — premium gold & black aesthetic.
/// Aligned with frontend CSS design system (index.css).
class AppTheme {
  // ── Light Theme ───────────────────────────────────────────────────
  static ThemeData get lightTheme => _buildTheme(Brightness.light);

  // ── Dark Theme ────────────────────────────────────────────────────
  static ThemeData get darkTheme => _buildTheme(Brightness.dark);

  // ── Admin Theme ───────────────────────────────────────────────────
  static ThemeData get adminTheme => _buildTheme(Brightness.dark);

  static ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    // Matches frontend CSS custom properties
    final backgroundColor = isDark ? AppColors.background : AppColors.backgroundLight;
    final surfaceColor = isDark ? AppColors.surface : AppColors.surfaceLight;
    final surfaceElevated = isDark ? AppColors.surfaceElevated : AppColors.surfaceTertiaryLight;
    final textPrimary = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final dividerColor = isDark ? AppColors.divider : AppColors.borderLight;

    return ThemeData(
      brightness: brightness,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: backgroundColor,
      fontFamily: 'Inter',
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: AppColors.primary,
        onPrimary: isDark ? Colors.black : AppColors.dark,
        secondary: AppColors.gold,
        onSecondary: AppColors.dark,
        surface: surfaceColor,
        onSurface: textPrimary,
        error: AppColors.error,
        onError: Colors.white,
      ),

        // ── AppBar — matches frontend .navbar ─────────────────────
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.dark,  // Always dark like frontend navbar
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          scrolledUnderElevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          titleTextStyle: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: 'Playfair Display',
            letterSpacing: 1.5,
          ),
          iconTheme: const IconThemeData(color: AppColors.gold, size: 22),
        ),

        // ── Elevated Button — matches frontend .btn-primary ───────
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.dark,
            minimumSize: const Size(double.infinity, 52),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),  // --radius-md
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              fontFamily: 'Inter',
              letterSpacing: 0.2,
            ),
          ),
        ),

        // ── Outlined Button — matches frontend .btn-outline ───────
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.gold,
            minimumSize: const Size(double.infinity, 52),
            side: const BorderSide(color: AppColors.gold, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              fontFamily: 'Inter',
            ),
          ),
        ),

        // ── Text Button ────────────────────────────────────────────
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.gold,
            textStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              fontFamily: 'Inter',
            ),
          ),
        ),

        // ── Input Decoration — matches frontend Input.css ─────────
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surfaceColor,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),  // --radius-md
            borderSide: BorderSide(color: dividerColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: dividerColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide:
                const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          hintStyle: TextStyle(
            color: isDark ? AppColors.textMuted : AppColors.textTertiaryLight,
            fontSize: 14,
          ),
          labelStyle: TextStyle(
            color: textSecondary,
            fontSize: 14,
          ),
          prefixIconColor: textSecondary,
          suffixIconColor: textSecondary,
        ),

        // ── Card — matches frontend .card ─────────────────────────
        cardTheme: CardThemeData(
          color: surfaceColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16), // --radius-lg
            side: BorderSide(color: dividerColor),
          ),
          margin: const EdgeInsets.only(bottom: 12),
        ),

        // ── Bottom Navigation ──────────────────────────────────────
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          selectedItemColor: AppColors.gold,
          unselectedItemColor: textSecondary,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          backgroundColor: surfaceColor,
          elevation: isDark ? 0 : 8,
          selectedLabelStyle:
              const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
        ),

        // ── NavigationBar (Material 3) ─────────────────────────────
        navigationBarTheme: NavigationBarThemeData(
          height: 68,
          backgroundColor: isDark ? AppColors.surface : AppColors.surfaceLight,
          surfaceTintColor: Colors.transparent,
          indicatorColor: AppColors.gold.withValues(alpha: 0.12),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: AppColors.gold, size: 24);
            }
            return IconThemeData(color: textSecondary, size: 24);
          }),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(
                color: AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              );
            }
            return TextStyle(
              color: textSecondary,
              fontSize: 11,
            );
          }),
        ),

        // ── Snackbar ───────────────────────────────────────────────
        snackBarTheme: SnackBarThemeData(
          backgroundColor: surfaceElevated,
          contentTextStyle: TextStyle(color: textPrimary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          behavior: SnackBarBehavior.floating,
        ),

        // ── Divider ────────────────────────────────────────────────
        dividerColor: dividerColor,
        dividerTheme: DividerThemeData(
          color: dividerColor,
          thickness: 1,
          space: 1,
        ),

        // ── Text Theme — Playfair Display for headings, Inter for body ─
        textTheme: TextTheme(
          displayLarge: TextStyle(
              color: textPrimary, fontFamily: 'Playfair Display'),
          displayMedium: TextStyle(
              color: textPrimary, fontFamily: 'Playfair Display'),
          headlineLarge: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w800,
              fontFamily: 'Playfair Display'),
          headlineMedium: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w700,
              fontFamily: 'Playfair Display'),
          titleLarge: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w700),
          bodyLarge: TextStyle(color: textPrimary),
          bodyMedium: TextStyle(color: textPrimary),
          bodySmall: TextStyle(color: textSecondary),
          labelLarge: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w600),
        ),

        // ── Icon Theme ─────────────────────────────────────────────
        iconTheme: IconThemeData(color: textSecondary),

        // ── Dialog ──────────────────────────────────────────────────
        dialogTheme: DialogThemeData(
          backgroundColor: surfaceColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),

        // ── Chip — matches frontend category badges ─────────────────
        chipTheme: ChipThemeData(
          backgroundColor: isDark ? AppColors.surfaceElevated : AppColors.surfaceTertiaryLight,
          selectedColor: AppColors.gold.withValues(alpha: 0.15),
          labelStyle: TextStyle(fontSize: 12, color: textPrimary),
          side: BorderSide(color: dividerColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      );
  }
}
