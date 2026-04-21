# <img src="assets/logo.png" alt="CURIO Logo" width="120" /> CURIO

### 🔧 Tech Versions

![Node.js](https://img.shields.io/badge/Node.js-v18.17.0-brightgreen?logo=node.js&logoColor=white) ![React](https://img.shields.io/badge/React-v18.2.0-61DAFB?logo=react&logoColor=white) ![Flutter](https://img.shields.io/badge/Flutter-v3.13.4-02569B?logo=flutter&logoColor=white) ![npm](https://img.shields.io/badge/npm-dependencies-blue?logo=npm) ![MySQL](https://img.shields.io/badge/MySQL-v8.1.0-4479A1?logo=mysql&logoColor=white)

---

**CURIO** is a **Full Stack Marketplace Platform** connecting **buyers and artisans**.  

Buyers request custom handmade products, while artisans showcase, sell, and apply to requests.  

The platform supports multiple clients, including a **React-based Web App** and **Flutter Mobile App**, all powered by a centralized Node.js/MySQL backend.

---

## 📦 Table of Contents

<details>
<summary>Click to expand</summary>

1. [Tech Stack](#-tech-stack)  
2. [Project Structure](#-project-structure)  
3. [Quick Setup (1-Click)](#-quick-setup)  
4. [Backend Setup](#-backend-setup)  
5. [Frontend (React) Setup](#-frontend-react-setup)  
6. [Mobile (Flutter) Setup](#-mobile-flutter-setup)  
7. [Database](#-database)  
8. [Features](#-features)  
9. [Prototype](#-prototype)  
10. [Authors](#-authors)  

</details>

---

## 🛠 Tech Stack

### Backend
* Node.js, Express.js, MySQL

### Frontend & Mobile
* **Web:** React.js (Vite)
* **Mobile:** Flutter

---

## 📁 Project Structure

```text
CURIO/
│
├── backend/               # Node.js API
│   ├── src/db/            # Database connection, init, and image seeding
│   ├── src/modules/       # Auth, User, Portfolio, Marketplace
│   └── src/index.js
│
├── frontend/              # React Web Application (Vite)
│   ├── src/               # React components, contexts, and hooks
│   └── public/
│
├── mobile_flutter/        # Flutter Mobile Application
│   ├── lib/
│   └── assets/
│
├── assets/                # README static files
├── package.json           # Root workspace script
├── start.bat              # Windows 1-Click Startup Script
└── .gitignore

```

---

## ⚡ Quick Setup (1-Click Startup)

If you're on Windows, starting the entire web platform is simple! You do not need to boot the frontend and backend manually.

1. Clone the repository:
```bash
git clone https://github.com/hagras/curio-fullstack.git
cd curio-fullstack
```

2. **1-Click Execution**: Just double-click the `start.bat` file located at the root of the project! It will start both the backend and frontend simultaneously, and automatically open your browser.

*Alternatively, via terminal:*
```bash
npm install
npm run dev
```

---

## 🖥 Backend Setup (Manual)

```bash
cd backend
npm install
npm run start
```

*The database and tables are automatically created on the first run if your MySQL credentials are set in your `.env`. You can force seed dynamic images by running `node src/db/setupdb.js`!*

---

## 🌐 Frontend (React) Setup (Manual)

Our frontend is powered by Vite and comes with built-in Light/Dark Mode theming!

```bash
cd frontend
npm install
npm run dev
```

Visit the web app at: [http://localhost:5173](http://localhost:5173)

---

## 📱 Mobile (Flutter) Setup

```bash
cd mobile_flutter
flutter pub get
flutter run
```

---

## 💾 Database Tables

The system auto-creates the following architecture:

* **User System:** `user`, `Buyer`, `Artisan`
* **Portfolio:** `PortfolioProjects`, `Gallery`
* **Marketplace:** `MarketItem`, `Order`, `OrderItem`
* **Custom Requests:** `Request`, `Application`, `Milestone`
* **Payments & Reviews:** `Payment`, `Review`

---

## ✨ Features

<details>
<summary>Global Features</summary>

* **Light & Dark Mode**: Persistent and responsive themes across the web app.
* **Smart UI Fallbacks**: Auto-filling dummy database images and fail-safes for broken media links.
* **Concurrent Execution**: Run the whole platform effortlessly with `npm run dev`.

</details>

<details>
<summary>Buyer Features</summary>

* Create custom requests
* Order artisan products
* Leave reviews and ratings

</details>

<details>
<summary>Artisan Features</summary>

* Create portfolio projects
* Upload gallery images
* Sell products in marketplace
* Apply to buyer requests

</details>

---

## 🎨 Prototype

<p align="center">
  <a href="https://www.figma.com/proto/UzAp7JCpZQc9DbDfvPjtnR/Curio?node-id=29-405&t=Ocdo2nqffXSr8q49-1">
    <img src="https://img.shields.io/badge/%20Launch%20Prototype-8A2BE2?style=for-the-badge&logo=figma&logoColor=white&labelColor=0d1117"/>
  </a>
</p>

---

## 👥 Authors

**Jana Hagras | Youssef Ahmed | Adham Baher | Anas Mohammed | Ahmed Abdelrehim**
