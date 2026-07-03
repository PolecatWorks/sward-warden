import { FertilisationPlansComponent } from './fertilisation-plans/fertilisation-plans.component';
import { SoilAnalysisResults } from './soil-analysis-results/soil-analysis-results';
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

import { HomeComponent } from './home/home.component';
import { FarmsComponent } from './home/farms/farms.component';
import { FieldsComponent } from './home/fields/fields.component';
import { FieldViewComponent } from './home/field-view/field-view.component';
import { ComplianceReportComponent } from './home/compliance-report/compliance-report.component';
import { SwardMovementsComponent } from './home/sward-movements/sward-movements.component';
import { FarmDetailComponent } from './home/farm-detail/farm-detail.component';

import { OptimizationEngineComponent } from './optimization-engine/optimization-engine.component';
import { WeatherIntegrationComponent } from './weather-integration/weather-integration.component';
import { TopologyMappingComponent } from './topology-mapping/topology-mapping.component';
import { WaterwayProtectionComponent } from './waterway-protection/waterway-protection.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FarmManagementComponent } from './farm-management/farm-management.component';

import { InventoryAndEquipmentComponent } from './inventory-and-equipment/inventory-and-equipment.component';
import { StorageCapacityComponent } from './storage-capacity/storage-capacity.component';
import { ChemicalPesticideInventoryComponent } from './chemical-pesticide-inventory/chemical-pesticide-inventory.component';
import { EquipmentTrackingComponent } from './equipment-tracking/equipment-tracking.component';
import { ImportExportContractsComponent } from './import-export-contracts/import-export-contracts.component';

import { ReportingAndExportComponent } from './reporting-and-export/reporting-and-export.component';
import { DigitalPesticideExportComponent } from './digital-pesticide-export/digital-pesticide-export.component';
import { AnnualFertilisationAccountsComponent } from './annual-fertilisation-accounts/annual-fertilisation-accounts.component';
import { GeneralFarmRecordsExportComponent } from './general-farm-records-export/general-farm-records-export.component';
import { SoilAnalysisReportsComponent } from './soil-analysis-reports/soil-analysis-reports.component';
import { ImportExportReportingComponent } from './import-export-reporting/import-export-reporting.component';
import { ErrorPageComponent } from './error-page/error-page.component';

import { authGuard } from './services/auth.guard';
import { moduleGuard } from './services/module.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'fertilisation-plans', component: FertilisationPlansComponent },
  {
    path: 'soil-analysis-results',
    component: SoilAnalysisResults,
    canActivate: [moduleGuard],
    data: { module: 'reports_and_analysis' }
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // ── Core Navigation ──
      { path: 'home', component: HomeComponent },
      { path: 'profile', component: UserProfileComponent },

      // ── Farm Hierarchy ──
      { path: 'farms', component: FarmsComponent },
      { path: 'farms/new', component: FarmsComponent },
      { path: 'farms/:farmId/edit', component: FarmDetailComponent },
      { path: 'farms/:farmId', component: FarmDetailComponent },
      { path: 'farms/:farmId/fields/new', component: FieldsComponent },
      { path: 'farms/:farmId/fields', component: FieldsComponent },
      {
        path: 'farms/:farmId/compliance',
        component: ComplianceReportComponent,
      },
      { path: 'farms/:farmId/topology', component: TopologyMappingComponent },
      { path: 'farms/:id/movements', component: SwardMovementsComponent },
      { path: 'fields', component: FieldsComponent },
      { path: 'fields/new', component: FieldsComponent },
      { path: 'fields/:fieldId/edit', component: FieldViewComponent },
      { path: 'fields/:fieldId', component: FieldViewComponent },

      // ── Farm Management ──
      { path: 'farm-management', component: FarmManagementComponent },

      // ── Environmental Tools ──
      { path: 'optimization', component: OptimizationEngineComponent },
      { path: 'weather', component: WeatherIntegrationComponent },
      { path: 'topology', component: TopologyMappingComponent },
      { path: 'waterway-protection', component: WaterwayProtectionComponent },

      // ── Inventory & Equipment (parent + children) ──
      { path: 'inventory', component: InventoryAndEquipmentComponent },
      { path: 'inventory/storage', component: StorageCapacityComponent },
      {
        path: 'inventory/chemical',
        component: ChemicalPesticideInventoryComponent,
      },
      { path: 'inventory/equipment', component: EquipmentTrackingComponent },
      {
        path: 'inventory/contracts',
        component: ImportExportContractsComponent,
      },

      // ── Reporting & Export (parent + children) ──
      {
        path: 'reporting',
        component: ReportingAndExportComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },
      {
        path: 'reporting/digital-pesticide',
        component: DigitalPesticideExportComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },
      {
        path: 'reporting/annual-fertilisation',
        component: AnnualFertilisationAccountsComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },
      {
        path: 'reporting/general-farm-records',
        component: GeneralFarmRecordsExportComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },
      {
        path: 'reporting/soil-analysis',
        component: SoilAnalysisReportsComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },
      {
        path: 'reporting/import-export',
        component: ImportExportReportingComponent,
        canActivate: [moduleGuard],
        data: { module: 'reports_and_analysis' }
      },

      // ── Default redirect ──
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: 'error', component: ErrorPageComponent },
  // Catch-all
  { path: '**', redirectTo: '/home' },
];
