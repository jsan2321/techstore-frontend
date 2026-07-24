import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'me'
  },
  {
    path: 'me',
    loadComponent: () => import('./pages/profile-home/profile-home.component').then((m) => m.ProfileHomeComponent)
  },
  {
    path: 'edit',
    pathMatch: 'full',
    redirectTo: 'me'
  },
  {
    path: 'password',
    pathMatch: 'full',
    redirectTo: 'me'
  },
  {
    path: 'deactivate',
    pathMatch: 'full',
    redirectTo: 'me'
  },
  {
    path: 'addresses',
    loadComponent: () => import('./pages/address-list/address-list.component').then((m) => m.AddressListComponent)
  },
  {
    path: 'addresses/new',
    loadComponent: () => import('./pages/address-form/address-form.component').then((m) => m.AddressFormComponent)
  },
  {
    path: 'addresses/:addressId/edit',
    loadComponent: () => import('./pages/address-form/address-form.component').then((m) => m.AddressFormComponent)
  }
];
