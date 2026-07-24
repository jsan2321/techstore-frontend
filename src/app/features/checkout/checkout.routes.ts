import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/checkout-home/checkout-home.component').then((m) => m.CheckoutHomeComponent)
  },
  {
    path: 'payment-status',
    loadComponent: () =>
      import('./pages/payment-status/payment-status.component').then((m) => m.PaymentStatusComponent)
  },
  {
    path: 'paypal/success',
    loadComponent: () =>
      import('./pages/payment-status/payment-status.component').then((m) => m.PaymentStatusComponent)
  },
  {
    path: 'paypal/cancel',
    loadComponent: () =>
      import('./pages/payment-status/payment-status.component').then((m) => m.PaymentStatusComponent)
  }
];
