import { Routes } from '@angular/router';
import { Dashboard } from '../pages/dashboard/dashboard';
import { LoginComponent } from '../pages/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
