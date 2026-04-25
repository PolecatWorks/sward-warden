import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, BehaviorSubject, of } from 'rxjs';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

import { SyncEngineService } from './sync-engine.service';
import { RxdbService, RXDB_STORAGE, RXDB_DB_NAME } from './rxdb/rxdb.service';
import { NetworkService } from './network.service';
import { SyncStateService } from './sync-state.service';
import { FarmManagementService } from './farm-management.service';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';

let syncTestCounter = 0;

describe('SyncEngineService', () => {
  let service: SyncEngineService;
  let rxdbService: RxdbService;
  let httpMock: HttpTestingController;
  let mockOnline$: BehaviorSubject<boolean>;
  let syncStateService: SyncStateService;
  let testDbName: string;

  beforeEach(() => {
    syncTestCounter++;
    testDbName = `sync-engine-test-${syncTestCounter}`;
    mockOnline$ = new BehaviorSubject<boolean>(false); // Start offline

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SyncEngineService,
        RxdbService,
        SyncStateService,
        {
          provide: FarmManagementService,
          useValue: {
            apiUrl$: of('/v0'),
            getHeaders: () => new HttpHeaders({
              'Content-Type': 'application/json',
              'X-User-ID': 'test-user',
            }),
          },
        },
        { provide: RXDB_STORAGE, useValue: getRxStorageMemory() },
        { provide: RXDB_DB_NAME, useValue: testDbName },
        { provide: NetworkService, useValue: { isOnline$: mockOnline$.asObservable() } },
        { provide: AuthService, useValue: { getUserId: () => 'test-user' } },
      ],
    });

    rxdbService = TestBed.inject(RxdbService);
    httpMock = TestBed.inject(HttpTestingController);
    syncStateService = TestBed.inject(SyncStateService);
    service = TestBed.inject(SyncEngineService);
  });

  afterEach(async () => {
    httpMock.verify();
    const db = await firstValueFrom(rxdbService.db$);
    await db.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process pending outbox entries via processOutbox()', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    // Insert a pending outbox entry
    await db.outbox.insert({
      id: 'outbox-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-farm-1',
      payload: JSON.stringify({ name: 'Sync Farm', location: 'Test' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    // Insert the corresponding local farm doc
    await db.farms.insert({
      id: 'local-farm-1',
      name: 'Sync Farm',
      location: 'Test',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Call processOutbox directly
    const processPromise = service.processOutbox();

    // Wait a tick for async processing
    await new Promise(resolve => setTimeout(resolve, 50));

    // Expect the POST to /v0/farms
    const farmReq = httpMock.expectOne('/v0/farms');
    expect(farmReq.request.method).toBe('POST');
    expect(farmReq.request.body).toEqual({ name: 'Sync Farm', location: 'Test' });
    farmReq.flush({ id: 42, name: 'Sync Farm', location: 'Test' });

    await processPromise;

    // Outbox should be empty
    const remaining = await db.outbox.find().exec();
    expect(remaining.length).toBe(0);

    // Local doc should be updated with serverId
    const farm = await db.farms.findOne('local-farm-1').exec();
    expect(farm?.serverId).toBe(42);
    expect(farm?.syncStatus).toBe('synced');
  });

  it('should increment retry count on failure', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.outbox.insert({
      id: 'outbox-fail-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-fail-1',
      payload: JSON.stringify({ name: 'Fail Farm', location: 'Nowhere' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    await db.farms.insert({
      id: 'local-fail-1',
      name: 'Fail Farm',
      location: 'Nowhere',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    const processPromise = service.processOutbox();

    await new Promise(resolve => setTimeout(resolve, 50));

    const farmReq = httpMock.expectOne('/v0/farms');
    farmReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await processPromise;

    // Outbox entry should still exist with incremented retryCount
    const entries = await db.outbox.find().exec();
    expect(entries.length).toBe(1);
    expect(entries[0].retryCount).toBe(1);
    expect(entries[0].status).toBe('pending');
  });

  it('should mark as failed after max retries', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.outbox.insert({
      id: 'outbox-maxretry-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-maxretry-1',
      payload: JSON.stringify({ name: 'Max Retry Farm', location: 'Nowhere' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 2, // Already at 2, one more failure → 3 = MAX_RETRIES
    });

    await db.farms.insert({
      id: 'local-maxretry-1',
      name: 'Max Retry Farm',
      location: 'Nowhere',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));

    const farmReq = httpMock.expectOne('/v0/farms');
    farmReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await processPromise;

    const entries = await db.outbox.find().exec();
    expect(entries.length).toBe(1);
    expect(entries[0].retryCount).toBe(3);
    expect(entries[0].status).toBe('failed');

    // Local doc should also be marked as failed
    const farm = await db.farms.findOne('local-maxretry-1').exec();
    expect(farm?.syncStatus).toBe('failed');
  });

  it('should process DELETE outbox entries', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.outbox.insert({
      id: 'outbox-del-1',
      actionType: 'DELETE',
      entityType: 'farms',
      localDocId: 'local-del-1',
      payload: JSON.stringify({ id: 55 }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));

    const delReq = httpMock.expectOne('/v0/farms/55');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null, { status: 204, statusText: 'No Content' });

    await processPromise;

    const remaining = await db.outbox.find().exec();
    expect(remaining.length).toBe(0);
  });

  it('should not process outbox when offline', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.outbox.insert({
      id: 'outbox-offline-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-offline-1',
      payload: JSON.stringify({ name: 'Offline Farm', location: 'Nowhere' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    // Stay offline — no HTTP requests should be made
    await new Promise(resolve => setTimeout(resolve, 50));

    const entries = await db.outbox.find().exec();
    expect(entries.length).toBe(1);
  });

  it('should drive SyncStateService transitions', async () => {
    const db = await firstValueFrom(rxdbService.db$);
    const states: string[] = [];

    // Go online first (before inserting outbox entries to avoid triggering auto-sync)
    mockOnline$.next(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    const sub = syncStateService.syncState$.subscribe(s => states.push(s));

    await db.outbox.insert({
      id: 'outbox-state-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-state-1',
      payload: JSON.stringify({ name: 'State Farm', location: 'Test' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    await db.farms.insert({
      id: 'local-state-1',
      name: 'State Farm',
      location: 'Test',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Call processOutbox directly (auto-sync already fired with empty queue)
    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));

    const farmReq = httpMock.expectOne('/v0/farms');
    farmReq.flush({ id: 100, name: 'State Farm', location: 'Test' });

    await processPromise;

    sub.unsubscribe();

    // States should include 'syncing' and end with 'synced'
    expect(states).toContain('syncing');
    expect(states[states.length - 1]).toBe('synced');
  });
});
