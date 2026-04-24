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

import { InventoryAndEquipmentComponent } from './inventory-and-equipment/inventory-and-equipment.component';
import { ReportingAndExportComponent } from './reporting-and-export/reporting-and-export.component';
import { StorageCapacityComponent } from './storage-capacity/storage-capacity.component';
import { ChemicalPesticideInventoryComponent } from './chemical-pesticide-inventory/chemical-pesticide-inventory.component';
import { EquipmentTrackingComponent } from './equipment-tracking/equipment-tracking.component';
import { ImportExportContractsComponent } from './import-export-contracts/import-export-contracts.component';
import { DigitalPesticideExportComponent } from './digital-pesticide-export/digital-pesticide-export.component';
import { AnnualFertilisationAccountsComponent } from './annual-fertilisation-accounts/annual-fertilisation-accounts.component';
import { GeneralFarmRecordsExportComponent } from './general-farm-records-export/general-farm-records-export.component';
import { SoilAnalysisReportsComponent } from './soil-analysis-reports/soil-analysis-reports.component';
import { ImportExportReportingComponent } from './import-export-reporting/import-export-reporting.component';


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

    { path: 'inventory-and-equipment', component: InventoryAndEquipmentComponent },
    { path: 'inventory-and-equipment/storage', component: StorageCapacityComponent },
    { path: 'inventory-and-equipment/chemical', component: ChemicalPesticideInventoryComponent },
    { path: 'inventory-and-equipment/equipment', component: EquipmentTrackingComponent },
    { path: 'inventory-and-equipment/contracts', component: ImportExportContractsComponent },
    { path: 'reporting-and-export', component: ReportingAndExportComponent },
    { path: 'reporting-and-export/digital-pesticide', component: DigitalPesticideExportComponent },
    { path: 'reporting-and-export/annual-fertilisation', component: AnnualFertilisationAccountsComponent },
    { path: 'reporting-and-export/general-farm-records', component: GeneralFarmRecordsExportComponent },
    { path: 'reporting-and-export/soil-analysis', component: SoilAnalysisReportsComponent },
    { path: 'reporting-and-export/import-export', component: ImportExportReportingComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home' }
];
