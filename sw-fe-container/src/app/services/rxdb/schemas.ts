/**
 * RxDB collection schemas for the sward-warden local-first database.
 *
 * Each schema mirrors the backend PostgreSQL model, with additional
 * fields for offline sync tracking (syncStatus, updatedAt).
 */
import { RxJsonSchema } from 'rxdb';

/** Sync status for local records */
export type SyncStatus = 'synced' | 'pending' | 'failed';

/** Document types matching the RxDB schemas */
export interface FarmDocType {
  id: string;
  serverId?: number;
  user_id?: number;
  name: string;
  location: string;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface FieldDocType {
  id: string;
  serverId?: number;
  farm_id: number;
  name: string;
  area_hectares: number;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface EventDocType {
  id: string;
  serverId?: number;
  field_id: number;
  event_type: string;
  description: string;
  date: string;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export const farmSchema: RxJsonSchema<FarmDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    serverId: { type: 'number' },
    user_id: { type: 'number' },
    name: { type: 'string' },
    location: { type: 'string' },
    syncStatus: { type: 'string', maxLength: 16, enum: ['synced', 'pending', 'failed'], default: 'pending' },
    updatedAt: { type: 'string', maxLength: 32 },
  },
  required: ['id', 'name', 'location', 'syncStatus', 'updatedAt'],
  indexes: ['syncStatus', 'updatedAt'],
};

export const fieldSchema: RxJsonSchema<FieldDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    serverId: { type: 'number' },
    farm_id: { type: 'number' },
    name: { type: 'string' },
    area_hectares: { type: 'number' },
    syncStatus: { type: 'string', maxLength: 16, enum: ['synced', 'pending', 'failed'], default: 'pending' },
    updatedAt: { type: 'string', maxLength: 32 },
  },
  required: ['id', 'farm_id', 'name', 'area_hectares', 'syncStatus', 'updatedAt'],
  indexes: ['syncStatus', 'updatedAt'],
};

export const eventSchema: RxJsonSchema<EventDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    serverId: { type: 'number' },
    field_id: { type: 'number' },
    event_type: { type: 'string' },
    description: { type: 'string' },
    date: { type: 'string' },
    syncStatus: { type: 'string', maxLength: 16, enum: ['synced', 'pending', 'failed'], default: 'pending' },
    updatedAt: { type: 'string', maxLength: 32 },
  },
  required: ['id', 'field_id', 'event_type', 'description', 'date', 'syncStatus', 'updatedAt'],
  indexes: ['syncStatus', 'updatedAt'],
};

/** Outbox entry for queuing offline writes. */
export type OutboxActionType = 'POST' | 'PUT' | 'DELETE';
export type OutboxEntityType = 'farms' | 'fields' | 'events';
export type OutboxStatus = 'pending' | 'failed';

export interface OutboxDocType {
  id: string;
  actionType: OutboxActionType;
  entityType: OutboxEntityType;
  /** The local RxDB document id that this outbox entry relates to. */
  localDocId: string;
  /** JSON-serialised payload for the HTTP request body. */
  payload: string;
  timestamp: string;
  status: OutboxStatus;
  retryCount: number;
}

export const outboxSchema: RxJsonSchema<OutboxDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    actionType: { type: 'string', maxLength: 8, enum: ['POST', 'PUT', 'DELETE'] },
    entityType: { type: 'string', maxLength: 16, enum: ['farms', 'fields', 'events'] },
    localDocId: { type: 'string', maxLength: 64 },
    payload: { type: 'string' },
    timestamp: { type: 'string', maxLength: 32 },
    status: { type: 'string', maxLength: 16, enum: ['pending', 'failed'], default: 'pending' },
    retryCount: { type: 'number', default: 0 },
  },
  required: ['id', 'actionType', 'entityType', 'localDocId', 'payload', 'timestamp', 'status', 'retryCount'],
  indexes: ['status', 'timestamp'],
};
