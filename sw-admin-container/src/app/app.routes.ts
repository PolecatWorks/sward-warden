import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { UserListComponent } from './components/user-list/user-list';
import { EntityExplorerComponent } from './components/entity-explorer/entity-explorer';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [roleGuard('support')], // Support or higher can access the console
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'explorer', component: EntityExplorerComponent },
      {
        path: 'users',
        component: UserListComponent,
        canActivate: [roleGuard('admin')] // Only admins can see user list
      },
    ]
  }
];
