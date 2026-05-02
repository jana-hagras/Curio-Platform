import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';

/// Centralized theme definitions — premium gold & black aesthetic.
class AppTheme {
  // ── Light Theme ───────────────────────────────────────────────────
  static ThemeData get lightTheme => _buildTheme(Brightness.light);

  // ── Dark Theme ────────────────────────────────────────────────────
  static ThemeData get darkTheme => _buildTheme(Brightness.dark);

  // ── Admin Theme ───────────────────────────────────────────────────
  static ThemeData get adminTheme => _buildTheme(Brightness.dark); // Default admin to dark, or allow toggle

  static ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    
    final backgroundColor = isDark ? AppColors.background : const Color(0xFFF8F9FA);
    final surfaceColor = isDark ? AppColors.surface : Colors.white;
    final surfaceLightColor = isDark ? AppColors.surfaceLight : const Color(0xFFF1F3F5);
    final textPrimary = isDark ? AppColors.textPrimary : const Color(0xFF1A1A1A);
    final textSecondary = isDark ? AppColors.textSecondary : const Color(0xFF666666);
    final dividerColor = isDark ? AppColors.divider : const Color(0xFFE9ECEF);
    
    return ThemeData(
      brightness: brightness,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: backgroundColor,
      fontFamily: 'Montserrat',
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: AppColors.primary,
        onPrimary: isDark ? Colors.black : Colors.white,
        secondary: AppColors.gold,
        onSecondary: Colors.black,
        surface: surfaceColor,
        onSurface: textPrimary,
        error: AppColors.error,
        onError: Colors.white,
      ),

        // ── AppBar ─────────────────────────────────────────────────
        appBarTheme: AppBarTheme(
          backgroundColor: backgroundColor,
          foregroundColor: textPrimary,
          elevation: 0,
          centerTitle: true,
          scrolledUnderElevation: 0,
          systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
          titleTextStyle: TextStyle(
            color: textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: 'Montserrat',
          ),
          iconTheme: const IconThemeData(color: AppColors.gold, size: 22),
        ),

        // ── Elevated Button ────────────────────────────────────────
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 52),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              fontFamily: 'Montserrat',
              letterSpacing: 0.5,
            ),
          ),
        ),

        // ── Outlined Button ────────────────────────────────────────
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.gold,
            minimumSize: const Size(double.infinity, 52),
            side: const BorderSide(color: AppColors.borderGold, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              fontFamily: 'Montserrat',
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
              fontFamily: 'Montserrat',
            ),
          ),
        ),

        // ── Input Decoration ───────────────────────────────────────
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surfaceColor,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: dividerColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: dividerColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          hintStyle: TextStyle(
            color: textSecondary,
            fontSize: 14,
          ),
          prefixIconColor: textSecondary,
          suffixIconColor: textSecondary,
        ),

        // ── Card ───────────────────────────────────────────────────
        cardTheme: CardThemeData(
          color: surfaceColor,
          elevation: isDark ? 4 : 2,
          shadowColor: Colors.black.withValues(alpha: isDark ? 0.4 : 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
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
          backgroundColor: surfaceColor,
          surfaceTintColor: Colors.transparent,
          indicatorColor: AppColors.gold.withValues(alpha: 0.12),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: AppColors.gold, size: 24);
            }
            return IconThemeData(
                color: textSecondary, size: 24);
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
          backgroundColor: surfaceLightColor,
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

        // ── Text Theme ─────────────────────────────────────────────
        textTheme: TextTheme(
          displayLarge: TextStyle(
              color: textPrimary, fontFamily: 'Playfair'),
          displayMedium: TextStyle(
              color: textPrimary, fontFamily: 'Playfair'),
          headlineLarge: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w800,
              fontFamily: 'Playfair'),
          headlineMedium: TextStyle(
              color: textPrimary,
              fontWeight: FontWeight.w700),
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

        // ── Chip ────────────────────────────────────────────────────
        chipTheme: ChipThemeData(
          backgroundColor: surfaceLightColor,
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
