import { TestBed } from '@angular/core/testing';
import { RxdbService, SwardDatabase, RXDB_STORAGE, RXDB_DB_NAME } from './rxdb.service';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { firstValueFrom } from 'rxjs';
import * as rxdbModule from 'rxdb';

let testCounter = 0;

describe('RxdbService', () => {
  let service: RxdbService;
  let testDbName: string;

  beforeEach(() => {
    testCounter++;
    testDbName = `rxdb-svc-test-${testCounter}`;
    TestBed.configureTestingModule({
      providers: [
        RxdbService,
        { provide: RXDB_STORAGE, useValue: getRxStorageMemory() },
        { provide: RXDB_DB_NAME, useValue: testDbName },
      ],
    });
    service = TestBed.inject(RxdbService);
  });

  afterEach(async () => {
    const db = await firstValueFrom(service.db$);
    await db.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a database with the configured name', async () => {
    const db = await firstValueFrom(service.db$);
    expect(db.name).toBe(testDbName);
  });

  it('should have a farms collection', async () => {
    const db = await firstValueFrom(service.db$);
    expect(db.farms).toBeDefined();
  });

  it('should have a fields collection', async () => {
    const db = await firstValueFrom(service.db$);
    expect(db.fields).toBeDefined();
  });

  it('should have an events collection', async () => {
    const db = await firstValueFrom(service.db$);
    expect(db.events).toBeDefined();
  });

  it('should insert and retrieve a farm document', async () => {
    const db = await firstValueFrom(service.db$);
    const doc = await db.farms.insert({
      id: 'test-farm-1',
      name: 'Sunrise Farm',
      location: 'Kerry, Ireland',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    expect(doc.name).toBe('Sunrise Farm');

    const found = await db.farms.findOne('test-farm-1').exec();
    expect(found).toBeTruthy();
    expect(found!.location).toBe('Kerry, Ireland');
  });

  it('should insert and retrieve a field document', async () => {
    const db = await firstValueFrom(service.db$);
    const doc = await db.fields.insert({
      id: 'test-field-1',
      farm_id: 1,
      name: 'North Meadow',
      area_hectares: 12.5,
      syncStatus: 'synced',
      updatedAt: new Date().toISOString(),
    });

    expect(doc.name).toBe('North Meadow');

    const found = await db.fields.findOne('test-field-1').exec();
    expect(found).toBeTruthy();
    expect(found!.area_hectares).toBe(12.5);
  });

  it('should insert and retrieve an event document', async () => {
    const db = await firstValueFrom(service.db$);
    const doc = await db.events.insert({
      id: 'test-event-1',
      field_id: 1,
      event_type: 'planting',
      description: 'Spring barley planting',
      date: '2026-03-15',
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    expect(doc.event_type).toBe('planting');

    const found = await db.events.findOne('test-event-1').exec();
    expect(found).toBeTruthy();
    expect(found!.description).toBe('Spring barley planting');
  });

  it('should return the same database instance on multiple db$ subscriptions', async () => {
    const db1 = await firstValueFrom(service.db$);
    const db2 = await firstValueFrom(service.db$);
    expect(db1).toBe(db2);
  });

  describe('Self-Healing & Fallback', () => {
    it('should wipe database and retry on initialization failure', async () => {
      // Close the database instance created during construction to avoid storage lock/removal conflicts
      const existingDb = await firstValueFrom(service.db$);
      await existingDb.close();

      let callCount = 0;
      const tryCreateSpy = spyOn<any>(service, 'tryCreateDatabase').and.callFake(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Simulated database corruption/schema mismatch');
        }
        tryCreateSpy.and.callThrough();
        return await service['tryCreateDatabase']();
      });

      const db = await service['createDatabase']();
      expect(db).toBeTruthy();
      expect(callCount).toBe(2);
    });

    it('should activate fallbackToRest on second failure', async () => {
      // Close the database instance created during construction to avoid storage lock/removal conflicts
      const existingDb = await firstValueFrom(service.db$);
      await existingDb.close();

      let callCount = 0;
      spyOn<any>(service, 'tryCreateDatabase').and.callFake(async () => {
        callCount++;
        throw new Error('Persistent failure');
      });

      try {
        await service['createDatabase']();
        fail('Should have thrown an error');
      } catch (err) {
        expect(callCount).toBe(2);
        expect(service.fallbackToRest$.value).toBe(true);
      }
    });
  });
});
