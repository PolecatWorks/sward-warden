import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

import { FarmManagementService } from './farm-management.service';
import { Farm } from '../models/farm';
import { AuthService } from './auth.service';
import { RxdbService, RXDB_STORAGE, RXDB_DB_NAME } from './rxdb/rxdb.service';
import { APP_CONFIG } from '../app-config';

let farmTestCounter = 0;

describe('FarmManagementService', () => {
  let service: FarmManagementService;
  let httpMock: HttpTestingController;
  let rxdbService: RxdbService;
  let testDbName: string;

  beforeEach(() => {
    farmTestCounter++;
    testDbName = `farm-svc-test-${farmTestCounter}`;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FarmManagementService,
        RxdbService,
        { provide: RXDB_STORAGE, useValue: getRxStorageMemory() },
        { provide: RXDB_DB_NAME, useValue: testDbName },
        {
          provide: AuthService,
          useValue: { getUserId: () => 'test-user' }
        },
        {
          provide: APP_CONFIG,
          useValue: { apiPath: '/api', logLevel: 'INFO' }
        }
      ],
    });
    service = TestBed.inject(FarmManagementService);
    httpMock = TestBed.inject(HttpTestingController);
    rxdbService = TestBed.inject(RxdbService);
  });

  afterEach(async () => {
    if (httpMock) {
      try {
        httpMock.verify();
      } catch (e) {
        // ignore verify errors if setup failed
      }
    }
    if (rxdbService) {
      try {
        const db = await firstValueFrom(rxdbService.db$);
        if (db) {
          await db.remove();
        }
      } catch (e) {
        // ignore
      }
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getFarms (local-first) ──────────────────────────────
  describe('getFarms', () => {
    it('should return farms from the local RxDB database', async () => {
      const db = await firstValueFrom(rxdbService.db$);
      await db.farms.insert({
        id: 'farm-1',
        serverId: 1,
        user_id: 1,
        name: 'Sunrise Farm',
        location: 'Kerry, Ireland',
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      });

      const farms = await firstValueFrom(service.getFarms().pipe(take(1)));
      expect(farms.length).toBe(1);
      expect(farms[0].name).toBe('Sunrise Farm');
      expect(farms[0].location).toBe('Kerry, Ireland');
    });

    it('should return an empty array when no farms exist locally', async () => {
      const farms = await firstValueFrom(service.getFarms().pipe(take(1)));
      expect(farms).toEqual([]);
    });
  });

  // ── addFarm (local-first) ───────────────────────────────
  describe('addFarm', () => {
    it('should insert a farm into the local RxDB database', async () => {
      const newFarm: Farm = { name: 'New Farm', location: 'Galway, Ireland' };
      const result = await firstValueFrom(service.addFarm(newFarm));

      expect(result.name).toBe('New Farm');
      expect(result.location).toBe('Galway, Ireland');

      // Verify it's in RxDB
      const db = await firstValueFrom(rxdbService.db$);
      const allFarms = await db.farms.find().exec();
      expect(allFarms.length).toBe(1);
      expect(allFarms[0].syncStatus).toBe('pending');
    });

    it('should generate a local id for the document', async () => {
      const newFarm: Farm = { name: 'Auto ID Farm', location: 'Cork, Ireland' };
      await firstValueFrom(service.addFarm(newFarm));

      const db = await firstValueFrom(rxdbService.db$);
      const docs = await db.farms.find().exec();
      expect(docs[0].id).toMatch(/^-/);
    });
  });

  // ── deleteEntity (local-first) ────────────────────────────
  describe('deleteEntity', () => {
    it('should remove a farm from the local RxDB database by serverId', async () => {
      const db = await firstValueFrom(rxdbService.db$);
      await db.farms.insert({
        id: 'farm-del-1',
        serverId: 42,
        user_id: 1,
        name: 'Doomed Farm',
        location: 'Nowhere',
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      });

      await firstValueFrom(service.deleteEntity('farms', 42));

      const remaining = await db.farms.find().exec();
      expect(remaining.length).toBe(0);
    });

    it('should create a DELETE outbox entry when deleting a farm', async () => {
      const db = await firstValueFrom(rxdbService.db$);
      await db.farms.insert({
        id: 'farm-del-outbox',
        serverId: 99,
        user_id: 1,
        name: 'Outbox Farm',
        location: 'Outbox',
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      });

      await firstValueFrom(service.deleteEntity('farms', 99));

      const outbox = await db.outbox.find().exec();
      expect(outbox.length).toBe(1);
      expect(outbox[0].actionType).toBe('DELETE');
      expect(outbox[0].entityType).toBe('farms');
    });

    it('should not throw when deleting a non-existent farm', async () => {
      await firstValueFrom(service.deleteEntity('farms', 999));
    });
  });

  // ── Outbox entries on writes ────────────────────────────
  describe('outbox entries', () => {
    it('should create a POST outbox entry when adding a farm', async () => {
      const newFarm: Farm = { name: 'Outbox Farm', location: 'Test' };
      await firstValueFrom(service.addFarm(newFarm));

      const db = await firstValueFrom(rxdbService.db$);
      const outbox = await db.outbox.find().exec();
      expect(outbox.length).toBe(1);
      expect(outbox[0].actionType).toBe('POST');
      expect(outbox[0].entityType).toBe('farms');
      expect(outbox[0].status).toBe('pending');

      const payload = JSON.parse(outbox[0].payload);
      expect(payload.name).toBe('Outbox Farm');
    });
  });
});
