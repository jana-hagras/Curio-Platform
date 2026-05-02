# <img src="assets/icons/logo.png" alt="CURIO Logo" width="80" /> Curio Mobile

### 📱 Multi-Flavor Flutter Ecosystem
The Curio mobile app is a high-performance, feature-rich application designed with a **Feature-First Modular Architecture**. It utilizes Flutter's **Flavors** to provide distinct binaries for platform users and administrators from a single codebase.

---

## 🎨 Design System
- **Theme:** Luxury Gold & Dark Mode.
- **Typography:** Playfair Display (Headers) & Montserrat (Body).
- **Components:** Custom theme-aware cards, buttons, and inputs with high-contrast accessibility.

---

## 🚀 Running the App

To run the application in development mode, you must specify the flavor and the corresponding entry point.

### Target Flavors
| User Type | Entry Point | Command |
| :--- | :--- | :--- |
| **Buyer / Artisan** | `lib/main_user.dart` | `flutter run --flavor user -t lib/main_user.dart` |
| **Administrator** | `lib/main_admin.dart` | `flutter run --flavor admin -t lib/main_admin.dart` |

---

## 📦 Building Production APKs

Generate release binaries for distribution:

### Build User APK
```bash
flutter build apk --flavor user -t lib/main_user.dart
```
*Output:* `build/app/outputs/flutter-apk/app-user-release.apk`

### Build Admin APK
```bash
flutter build apk --flavor admin -t lib/main_admin.dart
```
*Output:* `build/app/outputs/flutter-apk/app-admin-release.apk`

---

## 📁 Modular Structure
- `lib/core/`: Centralized themes, routing, and API configuration.
- `lib/features/`: Modularity by feature (e.g., `admin`, `artisan`, `auth`, `profile`).
- `lib/models/`: Robust data parsing (JSON to Object).
- `lib/providers/`: Global state management with **Provider**.

---

## 📊 Core Dependencies
- **fl_chart:** Advanced analytics and data visualization in the Admin dashboard.
- **http:** Seamless REST API integration.
- **provider:** Reactive state management.
- **image_picker:** Media handling for profiles and products.

---
<p align="center">Part of the Curio Marketplace Ecosystem</p>
