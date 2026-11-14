import Dexie, { Table } from 'dexie';
import {
  FarmDocType,
  FieldDocType,
  EventDocType,
  SoilAnalysisDocType,
  FertilisationPlanDocType,
  FarmRecordDocType,
  FertiliserApplicationDocType,
  OrganicManureApplicationDocType,
  ComplianceBreachDocType,
  SwardMovementDocType,
  InventoryStorageDocType,
  InventoryChemicalDocType,
  OutboxDocType,
  MetadataDocType,
} from '../rxdb/schemas';

/**
 * Dexie-based client database for SwardWarden.
 *
 * Provides unconstrained, high-performance offline storage across all 14 entity tables,
 * completely unconstrained by open-source collection limits (e.g. RxDB COL23).
 */
// PRD Reference: 0001, 0013
export class SwardDatabase extends Dexie {
  farms!: Table<FarmDocType, string>;
  fields!: Table<FieldDocType, string>;
  events!: Table<EventDocType, string>;
  soil_analyses!: Table<SoilAnalysisDocType, string>;
  fertilisation_plans!: Table<FertilisationPlanDocType, string>;
  farm_records!: Table<FarmRecordDocType, string>;
  fertiliser_applications!: Table<FertiliserApplicationDocType, string>;
  organic_manure_applications!: Table<OrganicManureApplicationDocType, string>;
  compliance_breaches!: Table<ComplianceBreachDocType, string>;
  sward_movements!: Table<SwardMovementDocType, string>;
  inventory_storage!: Table<InventoryStorageDocType, string>;
  inventory_chemicals!: Table<InventoryChemicalDocType, string>;
  outbox!: Table<OutboxDocType, string>;
  metadata!: Table<MetadataDocType, string>;

  constructor(dbName: string = 'swarddb') {
    super(dbName);

    // Schema version 1 defining primary keys and indexed lookup paths
    this.version(1).stores({
      farms: 'id, serverId, user_id, name, syncStatus, updatedAt',
      fields: 'id, serverId, farm_id, name, syncStatus, updatedAt',
      events: 'id, serverId, farm_id, field_id, event_type, date, syncStatus, updatedAt',
      soil_analyses: 'id, serverId, field_id, sample_date, syncStatus, updatedAt',
      fertilisation_plans: 'id, serverId, field_id, crop_type, application_date, syncStatus, updatedAt',
      farm_records: 'id, serverId, farm_id, record_type, syncStatus, updatedAt',
      fertiliser_applications: 'id, serverId, event_id, syncStatus, updatedAt',
      organic_manure_applications: 'id, serverId, event_id, syncStatus, updatedAt',
      compliance_breaches: 'id, serverId, farm_id, breach_date, syncStatus, updatedAt',
      sward_movements: 'id, serverId, farm_id, date, syncStatus, updatedAt',
      inventory_storage: 'id, serverId, farm_id, name, storage_type, syncStatus, updatedAt',
      inventory_chemicals: 'id, serverId, user_id, farm_id, name, mapp_number, syncStatus, updatedAt',
      outbox: 'id, actionType, entityType, localDocId, status, timestamp, retryCount',
      metadata: 'key',
    });
  }
}
