import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/shop-home/shop-home.component').then((m) => m.ShopHomeComponent)
  },
  {
    path: 'products/:productId',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];
