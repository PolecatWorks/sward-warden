import { Injectable, OnDestroy, InjectionToken, Inject, Optional } from '@angular/core';
import { createRxDatabase, RxDatabase, RxCollection, RxStorage } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { Observable, from, shareReplay, switchMap } from 'rxjs';
import {
  FarmDocType, FieldDocType, EventDocType,
  farmSchema, fieldSchema, eventSchema,
} from './schemas';

/** Injection token for providing an alternative RxStorage (e.g. memory for tests). */
export const RXDB_STORAGE = new InjectionToken<RxStorage<any, any>>('RXDB_STORAGE');

/** Injection token for overriding the database name (e.g. unique name per test). */
export const RXDB_DB_NAME = new InjectionToken<string>('RXDB_DB_NAME');

/** The shape of our RxDB database */
export type SwardCollections = {
  farms: RxCollection<FarmDocType>;
  fields: RxCollection<FieldDocType>;
  events: RxCollection<EventDocType>;
};
export type SwardDatabase = RxDatabase<SwardCollections>;

/**
 * Service responsible for creating and exposing the RxDB database.
 *
 * Consumers should use the `db$` observable or the typed collection
 * accessors (`farmsCollection$`, `fieldsCollection$`, `eventsCollection$`)
 * to interact with local data.
 *
 * For testing, provide `RXDB_STORAGE` with `getRxStorageMemory()` and
 * `RXDB_DB_NAME` with a unique name to avoid cross-test contamination.
 */
@Injectable({
  providedIn: 'root'
})
export class RxdbService implements OnDestroy {
  /** The lazily-initialised database observable — shared across all consumers. */
  readonly db$: Observable<SwardDatabase>;

  private storage: RxStorage<any, any>;
  private dbName: string;

  constructor(
    @Optional() @Inject(RXDB_STORAGE) storage: RxStorage<any, any> | null,
    @Optional() @Inject(RXDB_DB_NAME) dbName: string | null,
  ) {
    this.storage = storage || getRxStorageDexie();
    this.dbName = dbName || 'swarddb';
    this.db$ = from(this.createDatabase()).pipe(shareReplay(1));
  }

  /** Create the RxDB database and add all collections. */
  private async createDatabase(): Promise<SwardDatabase> {
    const db = await createRxDatabase<SwardCollections>({
      name: this.dbName,
      storage: this.storage,
      closeDuplicates: true,
    });

    await db.addCollections({
      farms: { schema: farmSchema },
      fields: { schema: fieldSchema },
      events: { schema: eventSchema },
    });

    return db;
  }

  /** Observable emitting the farms RxCollection. */
  get farmsCollection$(): Observable<RxCollection<FarmDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.farms))));
  }

  /** Observable emitting the fields RxCollection. */
  get fieldsCollection$(): Observable<RxCollection<FieldDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.fields))));
  }

  /** Observable emitting the events RxCollection. */
  get eventsCollection$(): Observable<RxCollection<EventDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.events))));
  }

  async ngOnDestroy(): Promise<void> {
    const db = await this.db$.toPromise();
    if (db) {
      await db.close();
    }
  }
}
