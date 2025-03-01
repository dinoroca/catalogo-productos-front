import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/container/container.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component'),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component'),
      },
    ]
  }
];
