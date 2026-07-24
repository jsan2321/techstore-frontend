import { Routes } from '@angular/router';
import { adminAlreadyLoggedInGuard } from './guards/admin-already-logged-in.guard';
import { authGuard } from '../../core/guards/auth.guard';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  // ── Admin Login — outside the layout shell, not linked in public nav ──────
  {
    path: 'auth/login',
    canActivate: [adminAlreadyLoggedInGuard],
    loadComponent: () =>
      import('./pages/admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },

  // ── Admin Layout Shell with sidebar ──────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin-products/admin-products.component').then(
            (m) => m.AdminProductsComponent
          ),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./pages/admin-brands/admin-brands.component').then(
            (m) => m.AdminBrandsComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent
          ),
      },
    ],
  },
];
