import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SyncStatusComponent } from './sync-status.component';
import { SyncStateService, SyncState } from '../services/sync-state.service';

describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;
  let syncState$: BehaviorSubject<SyncState>;

  beforeEach(async () => {
    syncState$ = new BehaviorSubject<SyncState>('synced');

    await TestBed.configureTestingModule({
      imports: [SyncStatusComponent],
      providers: [
        {
          provide: SyncStateService,
          useValue: { syncState$: syncState$.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show cloud_done icon when synced', () => {
    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('[data-testid="sync-status-synced"] .sync-icon--synced');
    expect(icon).toBeTruthy();
    expect(icon!.textContent).toContain('cloud_done');
  });

  it('should show cloud_off icon and Offline label when offline', () => {
    syncState$.next('offline');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('[data-testid="sync-status-offline"] .sync-icon--offline');
    expect(icon).toBeTruthy();
    expect(icon!.textContent).toContain('cloud_off');

    const label = el.querySelector('.sync-label--offline');
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain('Offline');
  });

  it('should show sync icon with animation when syncing', () => {
    syncState$.next('syncing');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('[data-testid="sync-status-syncing"] .sync-icon--syncing');
    expect(icon).toBeTruthy();
    expect(icon!.textContent).toContain('sync');
  });

  it('should not show a label when synced', () => {
    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('.sync-label--offline');
    expect(label).toBeNull();
  });
});
