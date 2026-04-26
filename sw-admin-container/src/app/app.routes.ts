import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { UserListComponent } from './components/user-list/user-list';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserListComponent },
    ]
  }
];
