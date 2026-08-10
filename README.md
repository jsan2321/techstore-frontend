# TechStore Frontend

TechStore Frontend is the Angular web client for the TechStore e-commerce application. It connects to the separate TechStore Backend API for catalog data, accounts, carts, checkout, orders, and administration.

## Features

- Product catalog browsing, search, filters, brands, and categories.
- Customer registration, login, Google Sign-In, email confirmation, and password recovery.
- Persisted shopping cart, saved addresses, checkout, and PayPal Sandbox payment flow.
- Customer order history and profile management.
- Administrative product, catalog, user, and order-management views.

## Technology

- Angular 21 with standalone components, signals, and Angular Router
- TypeScript 5.9, RxJS, Tailwind CSS 4, and PostCSS
- Angular build system and Vitest unit-test runner
- Nginx-based Docker image for static hosting

## Prerequisites

- Node.js compatible with the project dependencies
- npm 11 (the project records `npm@11.6.2`)
- A running TechStore Backend API, normally at `http://localhost:8081`

## Install and run

Install dependencies:

```bash
npm ci
```

Start the local development server:

```bash
npm start
```

Open `http://localhost:4200/` in a browser. The default API base URL is `/api/v1`; use Angular's development proxy or update your local server configuration when running the API separately. In the Render image, Nginx proxies `/api` to the private backend through `BACKEND_UPSTREAM`.

## Google Sign-In

The Google Identity Services client reads a browser OAuth client ID from this meta tag in `src/index.html`:

```html
<meta name="google-signin-client_id" content="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com">
```

A browser OAuth client ID is intentionally public. It is not a client secret and cannot provide access to a Google account. Configure the allowed JavaScript origins for this client in Google Cloud Console, and keep any client secret exclusively on the backend.

## Build and test

Create an optimized build:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```

Build a container image:

```bash
docker build -t techstore-frontend .
```

The Dockerfile builds the Angular application and serves the generated static files with Nginx on port `80`.

## Deployment notes

Set `BACKEND_UPSTREAM` on the Render frontend service to the private backend URL, including its port. Nginx applies SPA fallback, gzip, request-size limits, and browser security headers. The public frontend is the only service exposed to the internet; API requests stay same-origin under `/api`.

Set `SENTRY_DSN`, `SENTRY_ENVIRONMENT=render`, and `SENTRY_RELEASE` as Render environment variables to enable browser error reporting. The frontend generates `runtime-config.js` when its Nginx container starts; no DSN needs to be compiled into source code. Error events remove user, request body, cookies, and headers before sending.

The checkout is explicitly a PayPal Sandbox demo. It displays a persistent test-payment notice and must not be described as real-money payment processing.

## Project structure

- `src/app/core`: application configuration, API services, authentication, and HTTP interceptors.
- `src/app/features`: catalog, authentication, profile, checkout, cart, and administration features.
- `src/app/shared`: reusable components and utilities.
- `src/app/data`: application data and supporting models.

## Backend dependency

This client requires the separate `techstore-backend` service. Configure the backend's CORS allowlist and the frontend API base URL together when using a different origin or port.

## Repository hygiene

- Do not place passwords, API secrets, JWT secrets, PayPal secrets, or cloud credentials in frontend source files.
- The frontend must only contain public configuration such as its API URL and Google browser client ID.
- `node_modules`, generated build output, test coverage, and Angular cache files are ignored by Git.
