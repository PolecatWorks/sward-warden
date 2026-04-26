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

import { SlurryDashboardComponent } from './slurry-dashboard/slurry-dashboard.component';
import { ComplianceTrackingComponent } from './compliance-tracking/compliance-tracking.component';
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


export const routes: Routes = [
  { path: 'fertilisation-plans', component: FertilisationPlansComponent },
  { path: 'soil-analysis-results', component: SoilAnalysisResults },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // ── Core Navigation ──
      { path: 'home', component: HomeComponent },
      { path: 'dashboard', component: SlurryDashboardComponent },
      { path: 'compliance', component: ComplianceTrackingComponent },
      { path: 'profile', component: UserProfileComponent },

      // ── Farm Hierarchy ──
      { path: 'farms', component: FarmsComponent },
      { path: 'farms/:farmId/fields', component: FieldsComponent },
      { path: 'farms/:farmId/compliance', component: ComplianceReportComponent },
      { path: 'farms/:id/movements', component: SwardMovementsComponent },
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
      { path: 'inventory/chemical', component: ChemicalPesticideInventoryComponent },
      { path: 'inventory/equipment', component: EquipmentTrackingComponent },
      { path: 'inventory/contracts', component: ImportExportContractsComponent },

      // ── Reporting & Export (parent + children) ──
      { path: 'reporting', component: ReportingAndExportComponent },
      { path: 'reporting/digital-pesticide', component: DigitalPesticideExportComponent },
      { path: 'reporting/annual-fertilisation', component: AnnualFertilisationAccountsComponent },
      { path: 'reporting/general-farm-records', component: GeneralFarmRecordsExportComponent },
      { path: 'reporting/soil-analysis', component: SoilAnalysisReportsComponent },
      { path: 'reporting/import-export', component: ImportExportReportingComponent },

      // ── Default redirect ──
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  },
  // Catch-all
  { path: '**', redirectTo: '/home' }
];
