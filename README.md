# TechStore Frontend

[![Angular](https://img.shields.io/badge/Angular-21-red.svg?logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0-yellow.svg?logo=vitest)](https://vitest.dev/)
[![Backend Companion](https://img.shields.io/badge/Backend-Spring%20Boot%203.4-brightgreen.svg?logo=springboot)](https://github.com/jsan2321/techstore-backend)

> The modern web client for the **TechStore** e-commerce platform. Built with **Angular 21** utilizing **Standalone Components**, fine-grained **Signals reactivity**, and styled with **Tailwind CSS v4**.

🌐 **API Repository**: [TechStore Backend (Spring Boot 3.4)](https://github.com/jsan2321/techstore-backend)

---

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Admin Portal Access](#-admin-portal-access)
- [Testing the Checkout & PayPal Sandbox](#-testing-the-checkout--paypal-sandbox)
- [Project Architecture](#-project-architecture)
- [Build, Test & Deployment](#-build-test--deployment)

---

## ✨ Features

* **Product Catalog**: Live search, multi-faceted category and brand filtering, dynamic inventory status badges, and pagination.
* **Reactive Shopping Cart**: Synchronized state across client Signals and persisted user sessions in the backend.
* **3-Step Checkout Flow**: Shipping address selection/creation, order summary validation, and PayPal Sandbox payment modal.
* **Customer Authentication**: Self-registration, email confirmation, password recovery, JWT session renewal via HttpOnly cookies, and Google Sign-In.
* **Customer Profile**: Multi-address management (shipping/billing) with ISO country validation, plus full order history.
* **Dedicated Admin Dashboard**: Isolated admin layout (`/admin`) for managing products, categories, brands, orders, and customer accounts.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | Angular 21 (Standalone Components, Signals, Reactive Forms, Router) |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS v4, PostCSS, custom CSS variables |
| **State Management** | Angular Signals & RxJS Observables |
| **Unit Testing** | Vitest (`vitest@4.0`) |
| **Error Monitoring** | Sentry Browser SDK with client-side PII scrubbing |
| **Proxy & Serving** | Angular CLI dev proxy (`proxy.conf.json`) and Nginx for production |

---

## ⚡ Prerequisites

* **Node.js**: 20+ (LTS)
* **npm**: 11 (`npm@11.6.2`)
* **TechStore Backend API**: Running on **`http://localhost:8080`** (see [Backend Setup](https://github.com/jsan2321/techstore-backend))

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm ci
```

### 2. Start the Development Server

```bash
npm start
```

* Open **`http://localhost:4200`** in your browser.
* All `/api` requests are automatically routed to `http://localhost:8080` via `proxy.conf.json`.

---

## 🔑 Admin Portal Access

The administrative dashboard is intentionally hidden from public customer navigation.

1. Navigate directly to **[`http://localhost:4200/admin/auth/login`](http://localhost:4200/admin/auth/login)**.
2. Sign in with the seeded administrator credentials:
   * **Email**: `admin@goodshopping.local`
   * **Password**: `Admin123!`
3. Once authenticated with `ROLE_ADMIN`, you can manage:
   * **Dashboard Overview**: `/admin`
   * **Inventory & Products**: `/admin/products`
   * **Order Management**: `/admin/orders`
   * **Categories & Brands**: `/admin/categories`, `/admin/brands`
   * **User Accounts**: `/admin/users`

---

## 💳 Testing the Checkout & PayPal Sandbox

When testing order placement in Sandbox mode:

1. Add an in-stock product to your cart and proceed to `/checkout`.
2. Fill in or select a shipping address.
   * *Important*: The **Country** field requires a **2-letter ISO code** (e.g., `US`, `ES`, `CA`, `MX`).
3. Click **Proceed to PayPal**.
4. When the PayPal popup appears:
   * ❌ **Do NOT use** the store's business email (`sb-...@business.example.com`) or PayPal will reject it with *"You cannot pay yourself"*.
   * ✅ **Use a Personal Sandbox Account** (`sb-...@personal.example.com`) from your [PayPal Developer Dashboard](https://developer.paypal.com) under `Testing Tools` > `Sandbox Accounts`.
5. Approve the test transaction to complete the order and verify inventory deduction.

---

## 📂 Project Architecture

```
src/app/
├── core/                  # Core services, API config, HTTP interceptors, route guards
│   ├── auth/              # AuthService, token handling, session tracking
│   ├── config/            # API endpoint configuration
│   ├── guards/            # authGuard, adminGuard
│   └── interceptors/      # CSRF and Auth HTTP interceptors
│
├── features/              # Feature modules (views, pages, sub-routes)
│   ├── admin/             # Admin portal (dashboard, orders, products, users)
│   ├── auth/              # Customer login, register, password reset
│   ├── checkout/          # Multi-step checkout & payment processing
│   ├── profile/           # Saved address book and order history
│   └── shop/              # Product catalog, filters, search, and details
│
├── shared/                # Reusable UI components (buttons, badges, empty states, spinners)
└── data/                  # API data services and domain DTO models
```

---

## 🧪 Build, Test & Deployment

### Run Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
Compiled production assets are output to `dist/techstore-frontend`.

### Build & Run Container
```bash
docker build -t techstore-frontend .
docker run -p 80:80 techstore-frontend
```
The production image runs Nginx with SPA fallback routing, gzip compression, and secure HTTP headers.
