import { Routes } from '@angular/router';

export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cart-home/cart-home.component').then((m) => m.CartHomeComponent)
  }
];
