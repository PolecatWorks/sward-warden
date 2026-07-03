import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FarmManagementService } from '../services/farm-management.service';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Observable, BehaviorSubject, of, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RxdbService } from '../services/rxdb/rxdb.service';
import { InventoryStorageDocType } from '../services/rxdb/schemas';

export interface TopStorage extends InventoryStorageDocType {
  fillPercentage: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  farmId?: number;
  farmName?: string;
  fieldId?: number;
  fieldName?: string;
  global?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  currentUser$!: Observable<User>;
  farms$: Observable<Farm[]> = of([]);
  alerts$: Observable<Alert[]> = of([]);

  // Daily Action Traffic Light
  trafficLightStatus: 'green' | 'yellow' | 'red' = 'green';
  trafficLightMessage: string = 'Good to spread. Conditions are optimal.';

  // View mode
  isMultiFarm$: Observable<boolean> = of(false);
  groupedAlerts$: Observable<
    { farmId?: number; farmName?: string; alerts: Alert[] }[]
  > = of([]);
  globalAlerts$: Observable<Alert[]> = of([]);

  topStorages$: Observable<TopStorage[]> = of([]);
  maxStorageVolume: number = 100;

  constructor(
    private authService: AuthService,
    private farmManagementService: FarmManagementService,
    private rxdbService: RxdbService,
  ) {}

  // No obvious PRD requirement
  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.currentUser$ = this.farmManagementService.getUser(userId);
    }

    this.farms$ = this.farmManagementService.getFarms().pipe(
      catchError((err) => {
        console.error('Failed to load farms', err);
        return of([]);
      }),
    );

    this.isMultiFarm$ = this.farms$.pipe(
      // No obvious PRD requirement
      map((farms) => farms.length > 1),
    );

    // Mock Data initialization
    this.initMockData();

    this.rxdbService.db$.subscribe((db) => {
      db.inventory_storage.find().$.subscribe((storages) => {
        const sorted = [...storages].sort((a, b) => b.capacity_volume - a.capacity_volume).slice(0, 5);
        const top = sorted.map((s, index) => ({
          ...s,
          fillPercentage: 30 + (index * 15) % 60, // Mock fill percentage as no backend volume tracking exists
        }));

        this.maxStorageVolume = top.length > 0 ? Math.max(...top.map(s => s.capacity_volume)) : 100;
        this.topStorages$ = of(top);
      });
    });
  }

  // No obvious PRD requirement
  private initMockData() {
    // Determine Traffic Light Status (Mock Logic)
    const mockRainfall = Math.random() * 10;
    const isClosedPeriod =
      new Date().getMonth() === 11 || new Date().getMonth() === 0; // Nov, Dec, Jan

    if (isClosedPeriod) {
      this.trafficLightStatus = 'red';
      this.trafficLightMessage = 'Do not spread. Currently in closed period.';
    } else if (mockRainfall > 5) {
      this.trafficLightStatus = 'yellow';
      this.trafficLightMessage =
        'Proceed with caution. Recent rainfall detected.';
    } else {
      this.trafficLightStatus = 'green';
      this.trafficLightMessage = 'Good to spread. Conditions are optimal.';
    }

    // Mock Alerts
    this.alerts$ = this.farms$.pipe(
      map((farms) => {
        const mockAlerts: Alert[] = [];

        // Add a global alert
        if (isClosedPeriod) {
          mockAlerts.push({
            id: 'global-1',
            type: 'critical',
            message: 'National closed spreading period is currently in effect.',
            global: true,
          });
        }

        if (farms.length > 0) {
          const farmA = farms[0];
          mockAlerts.push({
            id: 'alert-1',
            type: 'warning',
            message: 'Requires a buffer zone due to recent rainfall.',
            farmId: farmA.id,
            farmName: farmA.name,
            fieldId: 101,
            fieldName: 'Field A',
          });

          if (farms.length > 1) {
            const farmB = farms[1];
            mockAlerts.push({
              id: 'alert-2',
              type: 'critical',
              message: 'Approaching nitrogen limit.',
              farmId: farmB.id,
              farmName: farmB.name,
            });
          }
        }
        return mockAlerts;
      }),
    );

    this.globalAlerts$ = this.alerts$.pipe(
      // No obvious PRD requirement
      map((alerts) => alerts.filter((a) => a.global)),
    );

    this.groupedAlerts$ = combineLatest([this.alerts$, this.farms$]).pipe(
      // No obvious PRD requirement
      map(([alerts, farms]) => {
        const farmAlerts = alerts.filter((a) => !a.global);
        const grouped = farms.map((farm) => {
          return {
            farmId: farm.id,
            farmName: farm.name,
            alerts: farmAlerts.filter((a) => a.farmId === farm.id),
          };
        });

        // Add any alerts not matched to a specific farm (if any)
        const matchedFarmIds = new Set(farms.map((f) => f.id));
        const unmatchedAlerts = farmAlerts.filter(
          (a) => !matchedFarmIds.has(a.farmId as number),
        );
        if (unmatchedAlerts.length > 0) {
          grouped.push({
            farmId: undefined,
            farmName: 'Unknown Farm',
            alerts: unmatchedAlerts,
          });
        }

        return grouped.filter((g) => g.alerts.length > 0);
      }),
    );
  }
}
