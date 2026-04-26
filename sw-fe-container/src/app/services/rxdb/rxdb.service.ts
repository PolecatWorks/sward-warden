import { Injectable, OnDestroy, InjectionToken, Inject, Optional } from '@angular/core';
import { createRxDatabase, RxDatabase, RxCollection, RxStorage } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { Observable, from, shareReplay, switchMap } from 'rxjs';
import {
  FarmDocType, FieldDocType, EventDocType, OutboxDocType, MetadataDocType,
  SoilAnalysisDocType, FertilisationPlanDocType, FarmRecordDocType,
  OrganicManureApplicationDocType, ComplianceBreachDocType,
  farmSchema, fieldSchema, eventSchema, outboxSchema, metadataSchema,
  soilAnalysisSchema, fertilisationPlanSchema, farmRecordSchema,
  organicManureApplicationSchema, complianceBreachSchema
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
  soil_analyses: RxCollection<SoilAnalysisDocType>;
  fertilisation_plans: RxCollection<FertilisationPlanDocType>;
  farm_records: RxCollection<FarmRecordDocType>;
  organic_manure_applications: RxCollection<OrganicManureApplicationDocType>;
  compliance_breaches: RxCollection<ComplianceBreachDocType>;
  outbox: RxCollection<OutboxDocType>;
  metadata: RxCollection<MetadataDocType>;
};
export type SwardDatabase = RxDatabase<SwardCollections>;

/**
 * Service responsible for creating and exposing the RxDB database.
 *
 * Consumers should use the `db$` observable or the typed collection
 * accessors (`farmsCollection$`, `fieldsCollection$`, `eventsCollection$`, etc.)
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
      soil_analyses: { schema: soilAnalysisSchema },
      fertilisation_plans: { schema: fertilisationPlanSchema },
      farm_records: { schema: farmRecordSchema },
      organic_manure_applications: { schema: organicManureApplicationSchema },
      compliance_breaches: { schema: complianceBreachSchema },
      outbox: { schema: outboxSchema },
      metadata: { schema: metadataSchema },
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

  /** Observable emitting the soil analyses RxCollection. */
  get soilAnalysesCollection$(): Observable<RxCollection<SoilAnalysisDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.soil_analyses))));
  }

  /** Observable emitting the fertilisation plans RxCollection. */
  get fertilisationPlansCollection$(): Observable<RxCollection<FertilisationPlanDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.fertilisation_plans))));
  }


  /** Observable emitting the farm records RxCollection. */
  get farmRecordsCollection$(): Observable<RxCollection<FarmRecordDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.farm_records))));
  }

  /** Observable emitting the outbox RxCollection. */
  get outboxCollection$(): Observable<RxCollection<OutboxDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.outbox))));
  }

  /** Observable emitting the metadata RxCollection. */
  get metadataCollection$(): Observable<RxCollection<MetadataDocType>> {
    return this.db$.pipe(switchMap(db => from(Promise.resolve(db.metadata))));
  }

  async ngOnDestroy(): Promise<void> {
    const db = await this.db$.toPromise();
    if (db) {
      await db.close();
    }
  }
}
