import { TestBed } from '@angular/core/testing';
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
    testDbName = `sync-engine-test-${syncTestCounter}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
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
              'X-User-ID': '1',
            }),
          },
        },
        { provide: RXDB_STORAGE, useFactory: () => getRxStorageMemory() },
        { provide: RXDB_DB_NAME, useValue: testDbName },
        { provide: NetworkService, useValue: { isOnline$: mockOnline$.asObservable() } },
        { provide: AuthService, useValue: { getUserId: () => '1' } },
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

  // ──────────────────────────────────────────────────────────
  // Push Sync (Outbox Processing)
  // ──────────────────────────────────────────────────────────

  it('should process pending outbox entries via processOutbox()', async () => {
    const db = await firstValueFrom(rxdbService.db$);

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

    await db.farms.insert({
      id: 'local-farm-1',
      name: 'Sync Farm',
      location: 'Test',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));

    const farmReq = httpMock.expectOne('/v0/farms');
    expect(farmReq.request.method).toBe('POST');
    farmReq.flush({ id: 42, name: 'Sync Farm', location: 'Test' });

    await processPromise;

    const remaining = await db.outbox.find().exec();
    expect(remaining.length).toBe(0);

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

    const entries = await db.outbox.find().exec();
    expect(entries.length).toBe(1);
    expect(entries[0].retryCount).toBe(1);
    expect(entries[0].status).toBe('pending');
  });


  it('should increment retry count when processEntry throws a non-HTTP error (e.g. invalid JSON)', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.outbox.insert({
      id: 'outbox-invalid-json-1',
      actionType: 'POST',
      entityType: 'farms',
      localDocId: 'local-invalid-json-1',
      payload: 'invalid-json-that-will-throw',
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    await db.farms.insert({
      id: 'local-invalid-json-1',
      name: 'Fail Farm',
      location: 'Nowhere',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));
    await processPromise;

    const entries = await db.outbox.find({ selector: { id: 'outbox-invalid-json-1' } }).exec();
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
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'pending',
      retryCount: 4,
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
    expect(entries[0].retryCount).toBe(5);
    expect(entries[0].status).toBe('failed');

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

    await new Promise(resolve => setTimeout(resolve, 50));

    const entries = await db.outbox.find().exec();
    expect(entries.length).toBe(1);
  });

  // ──────────────────────────────────────────────────────────
  // Pull Sync (Delta Fetch)
  // ──────────────────────────────────────────────────────────

  it('should pull new farms from the be', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne('/v0/sync');
    expect(syncReq.request.method).toBe('GET');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [
        { id: 1, user_id: 1, name: 'Server Farm', location: 'Dublin', updated_at: '2026-04-25T11:00:00Z', is_deleted: false },
      ],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;

    const farms = await db.farms.find().exec();
    expect(farms.length).toBe(1);
    expect(farms[0].name).toBe('Server Farm');
    expect(farms[0].serverId).toBe(1);
    expect(farms[0].syncStatus).toBe('synced');
  });

  it('should remove soft-deleted records on pull', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    // Pre-populate a farm
    await db.farms.insert({
      id: 'server-42',
      serverId: 42,
      user_id: 1,
      name: 'Old Farm',
      location: 'Cork',
      syncStatus: 'synced',
      updatedAt: '2026-04-25T10:00:00Z',
    });

    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne('/v0/sync');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [
        { id: 42, user_id: 1, name: 'Old Farm', location: 'Cork', updated_at: '2026-04-25T11:00:00Z', is_deleted: true },
      ],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;

    const farms = await db.farms.find().exec();
    expect(farms.length).toBe(0);
  });

  it('should update existing records when server is newer (LWW)', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.farms.insert({
      id: 'server-10',
      serverId: 10,
      user_id: 1,
      name: 'Old Name',
      location: 'Old Location',
      syncStatus: 'synced',
      updatedAt: '2026-04-25T09:00:00Z',
    });

    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne('/v0/sync');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [
        { id: 10, user_id: 1, name: 'New Name', location: 'New Location', updated_at: '2026-04-25T11:00:00Z', is_deleted: false },
      ],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;

    const farm = await db.farms.findOne('server-10').exec();
    expect(farm?.name).toBe('New Name');
    expect(farm?.location).toBe('New Location');
    expect(farm?.syncStatus).toBe('synced');
  });

  it('should keep local record when local is newer with pending outbox (LWW)', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await db.farms.insert({
      id: 'server-20',
      serverId: 20,
      user_id: 1,
      name: 'Local Edit',
      location: 'Local Location',
      syncStatus: 'pending',
      updatedAt: '2026-04-25T11:30:00Z', // local is newer
    });

    // Pending outbox entry for this doc
    await db.outbox.insert({
      id: 'outbox-pending',
      actionType: 'PUT',
      entityType: 'farms',
      localDocId: 'server-20',
      payload: JSON.stringify({ id: 20, name: 'Local Edit', location: 'Local Location' }),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });

    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne('/v0/sync');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [
        { id: 20, user_id: 1, name: 'Server Name', location: 'Server Location', updated_at: '2026-04-25T10:00:00Z', is_deleted: false },
      ],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;

    // Local should be kept (local is newer + has pending outbox)
    const farm = await db.farms.findOne('server-20').exec();
    expect(farm?.name).toBe('Local Edit');
  });

  // ──────────────────────────────────────────────────────────
  // Checkpoint Management
  // ──────────────────────────────────────────────────────────

  it('should store and retrieve checkpoint', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    // Initially no checkpoint
    const initial = await service.getCheckpoint(db);
    expect(initial).toBeNull();

    // Set a checkpoint
    await service.setCheckpoint(db, '2026-04-25T12:00:00Z');
    const stored = await service.getCheckpoint(db);
    expect(stored).toBe('2026-04-25T12:00:00Z');
  });

  it('should use checkpoint as since parameter on pull', async () => {
    const db = await firstValueFrom(rxdbService.db$);

    await service.setCheckpoint(db, '2026-04-25T10:00:00Z');

    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne(
      (req) => req.url.includes('/v0/sync') && req.url.includes('since=')
    );
    expect(syncReq.request.url).toContain('2026-04-25T10%3A00%3A00Z');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;

    // Checkpoint should be updated
    const newCheckpoint = await service.getCheckpoint(db);
    expect(newCheckpoint).toBe('2026-04-25T12:00:00Z');
  });

  it('should do full sync without since when no checkpoint exists', async () => {
    const pullPromise = service.pullSync();
    await new Promise(resolve => setTimeout(resolve, 50));

    const syncReq = httpMock.expectOne('/v0/sync');
    expect(syncReq.request.url).toBe('/v0/sync');
    syncReq.flush({
      checkpoint: '2026-04-25T12:00:00Z',
      farms: [],
      fields: [],
      events: [],
      farm_records: [],
    });

    await pullPromise;
  });

  // ──────────────────────────────────────────────────────────
  // SyncState Transitions
  // ──────────────────────────────────────────────────────────

  it('should drive SyncStateService transitions during processOutbox', async () => {
    const db = await firstValueFrom(rxdbService.db$);
    const states: string[] = [];

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

    const processPromise = service.processOutbox();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Handle the background sync pull request triggered by going online
    const syncReq = httpMock.expectOne('/v0/sync');
    syncReq.flush({ checkpoint: 'test', farms: [], fields: [], events: [], farm_records: [] });

    const farmReq = httpMock.expectOne('/v0/farms');
    farmReq.flush({ id: 100, name: 'State Farm', location: 'Test' });

    await processPromise;

    sub.unsubscribe();

    expect(states).toContain('syncing');
    expect(states[states.length - 1]).toBe('synced');
  });

  describe('Outbox Backoff and Client Error Handling', () => {
    it('should respect backoff period on retry', async () => {
      const db = await firstValueFrom(rxdbService.db$);

      await db.outbox.insert({
        id: 'outbox-backoff-1',
        actionType: 'POST',
        entityType: 'farms',
        localDocId: 'local-backoff-1',
        payload: JSON.stringify({ name: 'Backoff Farm', location: 'Nowhere' }),
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 1,
      });

      await db.farms.insert({
        id: 'local-backoff-1',
        name: 'Backoff Farm',
        location: 'Nowhere',
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });

      await service.processOutbox();

      httpMock.expectNone('/v0/farms');

      const entries = await db.outbox.find().exec();
      expect(entries.length).toBe(1);
      expect(entries[0].retryCount).toBe(1);
    });

    it('should mark as failed immediately on 400 client error', async () => {
      const db = await firstValueFrom(rxdbService.db$);

      await db.outbox.insert({
        id: 'outbox-400-1',
        actionType: 'POST',
        entityType: 'farms',
        localDocId: 'local-400-1',
        payload: JSON.stringify({ name: 'Invalid Farm', location: 'Invalid' }),
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
      });

      await db.farms.insert({
        id: 'local-400-1',
        name: 'Invalid Farm',
        location: 'Invalid',
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });

      const processPromise = service.processOutbox();
      await new Promise(resolve => setTimeout(resolve, 50));

      const farmReq = httpMock.expectOne('/v0/farms');
      farmReq.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      await processPromise;

      const entries = await db.outbox.find().exec();
      expect(entries.length).toBe(1);
      expect(entries[0].status).toBe('failed');
      expect(entries[0].retryCount).toBe(1);

      const farm = await db.farms.findOne('local-400-1').exec();
      expect(farm?.syncStatus).toBe('failed');
    });
  });
});
