import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FarmManagementComponent } from './farm-management/farm-management.component';
import { SlurryDashboardComponent } from './slurry-dashboard/slurry-dashboard.component';
import { ComplianceTrackingComponent } from './compliance-tracking/compliance-tracking.component';
import { OptimizationEngineComponent } from './optimization-engine/optimization-engine.component';
import { WeatherIntegrationComponent } from './weather-integration/weather-integration.component';
import { TopologyMappingComponent } from './topology-mapping/topology-mapping.component';
import { WaterwayProtectionComponent } from './waterway-protection/waterway-protection.component';
import { FarmsComponent } from './home/farms/farms.component';
import { FieldsComponent } from './home/fields/fields.component';
import { FieldViewComponent } from './home/field-view/field-view.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'home/farms', component: FarmsComponent },
    { path: 'home/farms/:farmId/fields', component: FieldsComponent },
    { path: 'home/fields/:fieldId', component: FieldViewComponent },
    { path: 'user-profile', component: UserProfileComponent },
    { path: 'farm-management', component: FarmManagementComponent },
    { path: 'slurry-dashboard', component: SlurryDashboardComponent },
    { path: 'compliance-tracking', component: ComplianceTrackingComponent },
    { path: 'optimization-engine', component: OptimizationEngineComponent },
    { path: 'weather-integration', component: WeatherIntegrationComponent },
    { path: 'topology-mapping', component: TopologyMappingComponent },
    { path: 'waterway-protection', component: WaterwayProtectionComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
