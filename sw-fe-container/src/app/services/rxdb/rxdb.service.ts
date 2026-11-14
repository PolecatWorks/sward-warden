import { LoggerService } from '../logger.service';
import {
  Injectable,
  OnDestroy,
  InjectionToken,
  Inject,
  Optional,
} from '@angular/core';
import { Observable, from, shareReplay, switchMap, BehaviorSubject, of } from 'rxjs';
import { SwardDatabase as SwardDexieDatabase } from '../database/sward-database';
import { DexieCollectionAdapter } from '../database/dexie-adapters';
import {
  FarmDocType,
  FieldDocType,
  EventDocType,
  OutboxDocType,
  MetadataDocType,
  SoilAnalysisDocType,
  FertilisationPlanDocType,
  FarmRecordDocType,
  FertiliserApplicationDocType,
  OrganicManureApplicationDocType,
  ComplianceBreachDocType,
  SwardMovementDocType,
  InventoryStorageDocType,
  InventoryChemicalDocType,
} from './schemas';

export const RXDB_STORAGE = new InjectionToken<any>('RXDB_STORAGE');
export const RXDB_DB_NAME = new InjectionToken<string>('RXDB_DB_NAME');

/**
 * Compatible shape providing typed collection accessors for all 14 entities.
 */
export type SwardDatabaseCollections = {
  farms: DexieCollectionAdapter<FarmDocType>;
  fields: DexieCollectionAdapter<FieldDocType>;
  events: DexieCollectionAdapter<EventDocType>;
  soil_analyses: DexieCollectionAdapter<SoilAnalysisDocType>;
  fertilisation_plans: DexieCollectionAdapter<FertilisationPlanDocType>;
  farm_records: DexieCollectionAdapter<FarmRecordDocType>;
  fertiliser_applications: DexieCollectionAdapter<FertiliserApplicationDocType>;
  organic_manure_applications: DexieCollectionAdapter<OrganicManureApplicationDocType>;
  compliance_breaches: DexieCollectionAdapter<ComplianceBreachDocType>;
  sward_movements: DexieCollectionAdapter<SwardMovementDocType>;
  inventory_storage: DexieCollectionAdapter<InventoryStorageDocType>;
  inventory_chemicals: DexieCollectionAdapter<InventoryChemicalDocType>;
  outbox: DexieCollectionAdapter<OutboxDocType>;
  metadata: DexieCollectionAdapter<MetadataDocType>;
  name: string;
  rawDb: SwardDexieDatabase;
  close: () => Promise<void>;
  remove: () => Promise<void>;
};

export type SwardCollections = SwardDatabaseCollections;
export type SwardDatabaseType = SwardDatabaseCollections;
export type SwardDatabase = SwardDatabaseCollections;

@Injectable({
  providedIn: 'root',
})
export class RxdbService implements OnDestroy {
  public db$: Observable<SwardDatabaseCollections>;
  public fallbackToRest$ = new BehaviorSubject<boolean>(false);

  private dbInstance: SwardDexieDatabase | null = null;
  private wrappedCollections: SwardDatabaseCollections | null = null;
  private dbName: string;

  constructor(
    private logger: LoggerService,
    @Optional() @Inject(RXDB_STORAGE) private customStorage?: any,
    @Optional() @Inject(RXDB_DB_NAME) private customDbName?: string,
  ) {
    this.dbName = this.customDbName || this.getScopedDatabaseName();
    this.db$ = from(this.createDatabase()).pipe(shareReplay(1));
  }

  // PRD Reference: 0013
  private getScopedDatabaseName(): string {
    try {
      const storedUserId = localStorage.getItem('sward_user_id');
      if (storedUserId) {
        return `swarddb_${storedUserId}`;
      }
    } catch (e: any) {
      this.logger.warn('Failed to read sward_user_id from localStorage', e);
    }
    return 'swarddb_default';
  }

  // PRD Reference: 0001, 0015
  public async wipeDatabase(): Promise<void> {
    this.logger.warn(`Wiping Dexie database: ${this.dbName}`);
    if (this.dbInstance) {
      await this.dbInstance.close();
      this.dbInstance = null;
      this.wrappedCollections = null;
    }
    const Dexie = (await import('dexie')).default;
    await Dexie.delete(this.dbName);
  }

  // PRD Reference: 0001, 0015
  public async tryCreateDatabase(): Promise<SwardDatabaseCollections> {
    return await this.initDexie();
  }

  // PRD Reference: 0001, 0015
  private async createDatabase(): Promise<SwardDatabaseCollections> {
    try {
      return await this.tryCreateDatabase();
    } catch (err: any) {
      this.logger.warn('Dexie Database initialization failed. Attempting self-healing/wipe...', err);
      try {
        await this.wipeDatabase();
        this.logger.info('Dexie Database successfully wiped. Re-attempting initialization.');
        return await this.tryCreateDatabase();
      } catch (retryErr: any) {
        this.logger.error('Dexie Database initialization failed on second attempt. Falling back to REST mode.', retryErr);
        this.fallbackToRest$.next(true);
        throw retryErr;
      }
    }
  }

  private async initDexie(): Promise<SwardDatabaseCollections> {
    this.dbInstance = new SwardDexieDatabase(this.dbName);
    await this.dbInstance.open();

    this.wrappedCollections = {
      farms: new DexieCollectionAdapter<FarmDocType>(this.dbInstance.farms),
      fields: new DexieCollectionAdapter<FieldDocType>(this.dbInstance.fields),
      events: new DexieCollectionAdapter<EventDocType>(this.dbInstance.events),
      soil_analyses: new DexieCollectionAdapter<SoilAnalysisDocType>(this.dbInstance.soil_analyses),
      fertilisation_plans: new DexieCollectionAdapter<FertilisationPlanDocType>(this.dbInstance.fertilisation_plans),
      farm_records: new DexieCollectionAdapter<FarmRecordDocType>(this.dbInstance.farm_records),
      fertiliser_applications: new DexieCollectionAdapter<FertiliserApplicationDocType>(this.dbInstance.fertiliser_applications),
      organic_manure_applications: new DexieCollectionAdapter<OrganicManureApplicationDocType>(this.dbInstance.organic_manure_applications),
      compliance_breaches: new DexieCollectionAdapter<ComplianceBreachDocType>(this.dbInstance.compliance_breaches),
      sward_movements: new DexieCollectionAdapter<SwardMovementDocType>(this.dbInstance.sward_movements),
      inventory_storage: new DexieCollectionAdapter<InventoryStorageDocType>(this.dbInstance.inventory_storage),
      inventory_chemicals: new DexieCollectionAdapter<InventoryChemicalDocType>(this.dbInstance.inventory_chemicals),
      outbox: new DexieCollectionAdapter<OutboxDocType>(this.dbInstance.outbox),
      metadata: new DexieCollectionAdapter<MetadataDocType>(this.dbInstance.metadata),
      name: this.dbName,
      rawDb: this.dbInstance,
      close: async () => {
        if (this.dbInstance) {
          await this.dbInstance.close();
        }
      },
      remove: async () => {
        await this.wipeDatabase();
      },
    };

    return this.wrappedCollections;
  }

  get inventoryStorageCollection$(): Observable<DexieCollectionAdapter<InventoryStorageDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.inventory_storage)));
  }

  get inventoryChemicalsCollection$(): Observable<DexieCollectionAdapter<InventoryChemicalDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.inventory_chemicals)));
  }

  get farmsCollection$(): Observable<DexieCollectionAdapter<FarmDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.farms)));
  }

  get fieldsCollection$(): Observable<DexieCollectionAdapter<FieldDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.fields)));
  }

  get eventsCollection$(): Observable<DexieCollectionAdapter<EventDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.events)));
  }

  get soilAnalysesCollection$(): Observable<DexieCollectionAdapter<SoilAnalysisDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.soil_analyses)));
  }

  get fertilisationPlansCollection$(): Observable<DexieCollectionAdapter<FertilisationPlanDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.fertilisation_plans)));
  }

  get farmRecordsCollection$(): Observable<DexieCollectionAdapter<FarmRecordDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.farm_records)));
  }

  get fertiliserApplicationsCollection$(): Observable<DexieCollectionAdapter<FertiliserApplicationDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.fertiliser_applications)));
  }

  get swardMovementsCollection$(): Observable<DexieCollectionAdapter<SwardMovementDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.sward_movements)));
  }

  get outboxCollection$(): Observable<DexieCollectionAdapter<OutboxDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.outbox)));
  }

  get metadataCollection$(): Observable<DexieCollectionAdapter<MetadataDocType>> {
    return this.db$.pipe(switchMap((db) => of(db.metadata)));
  }

  async ngOnDestroy(): Promise<void> {
    if (this.dbInstance) {
      await this.dbInstance.close();
      this.dbInstance = null;
    }
  }
}
