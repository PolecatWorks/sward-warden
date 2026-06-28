import { Injectable } from '@angular/core';
import { Observable, switchMap, map, from, firstValueFrom } from 'rxjs';
import { RxdbService, SwardDatabase } from './rxdb/rxdb.service';
import { InventoryChemicalDocType, OutboxEntityType } from './rxdb/schemas';
import { SyncEngineService } from './sync-engine.service';
import { AuthService } from './auth.service';

let localIdCounter = 0;
function generateLocalId(): string {
  localIdCounter = (localIdCounter + 1) % 100;
  return `-${Date.now()}${localIdCounter.toString().padStart(2, '0')}`;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryChemicalsService {
  constructor(
    private rxdbService: RxdbService,
    private syncEngine: SyncEngineService,
    private authService: AuthService,
  ) {}

  getChemicals(): Observable<InventoryChemicalDocType[]> {
    return this.rxdbService.inventoryChemicalsCollection$.pipe(
      switchMap((collection) => collection.find().$),
    );
  }

  getChemicalsForFarm(farmId: number): Observable<InventoryChemicalDocType[]> {
    return this.rxdbService.inventoryChemicalsCollection$.pipe(
      switchMap(
        (collection) =>
          collection.find({
            selector: {
              farm_id: farmId,
            },
          }).$,
      ),
    );
  }

  getPortfolioChemicals(): Observable<InventoryChemicalDocType[]> {
    return this.rxdbService.inventoryChemicalsCollection$.pipe(
      switchMap(
        (collection) =>
          collection.find({
            selector: {
              farm_id: { $exists: false },
            },
          }).$,
      ),
    );
  }

  private async createOutboxEntry(
    actionType: 'POST' | 'PUT' | 'DELETE',
    entityType: OutboxEntityType,
    localDocId: string,
    payload: object,
  ): Promise<void> {
    const db = await firstValueFrom(this.rxdbService.db$);
    await db.outbox.insert({
      id: generateLocalId(),
      actionType,
      entityType,
      localDocId,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
  }

  async addChemical(
    chemical: Partial<InventoryChemicalDocType>,
  ): Promise<void> {
    const userId = Number(this.authService.getUserId());
    if (isNaN(userId)) {
      throw new Error('User not authenticated');
    }

    const collection = await firstValueFrom(
      this.rxdbService.inventoryChemicalsCollection$,
    );

    // Generate a temporary negative ID for local creation before sync
    const tempId = generateLocalId();

    const newDoc = await collection.insert({
      id: tempId,
      user_id: userId,
      farm_id: chemical.farm_id,
      name: chemical.name!,
      mapp_number: chemical.mapp_number!,
      active_ingredient: chemical.active_ingredient,
      quantity_on_hand: chemical.quantity_on_hand,
      unit: chemical.unit,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    await this.createOutboxEntry('POST', 'inventory_chemicals', newDoc.id, {
      farm_id: chemical.farm_id,
      name: chemical.name,
      mapp_number: chemical.mapp_number,
      active_ingredient: chemical.active_ingredient,
      quantity_on_hand: chemical.quantity_on_hand,
      unit: chemical.unit,
    });

    // Trigger sync immediately to get the server ID
    this.syncEngine.fullSync();
  }

  async updateChemical(
    id: string,
    updates: Partial<InventoryChemicalDocType>,
  ): Promise<void> {
    const collection = await firstValueFrom(
      this.rxdbService.inventoryChemicalsCollection$,
    );
    const doc = await collection.findOne(id).exec();

    if (!doc) {
      throw new Error(`Chemical with id ${id} not found`);
    }

    await doc.incrementalPatch({
      ...updates,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    if (doc.serverId) {
      await this.createOutboxEntry('PUT', 'inventory_chemicals', doc.id, {
        id: doc.serverId,
        farm_id: updates.farm_id !== undefined ? updates.farm_id : doc.farm_id,
        name: updates.name !== undefined ? updates.name : doc.name,
        mapp_number:
          updates.mapp_number !== undefined
            ? updates.mapp_number
            : doc.mapp_number,
        active_ingredient:
          updates.active_ingredient !== undefined
            ? updates.active_ingredient
            : doc.active_ingredient,
        quantity_on_hand:
          updates.quantity_on_hand !== undefined
            ? updates.quantity_on_hand
            : doc.quantity_on_hand,
        unit: updates.unit !== undefined ? updates.unit : doc.unit,
      });
      this.syncEngine.fullSync();
    }
  }

  async deleteChemical(id: string): Promise<void> {
    const collection = await firstValueFrom(
      this.rxdbService.inventoryChemicalsCollection$,
    );
    const doc = await collection.findOne(id).exec();

    if (!doc) {
      throw new Error(`Chemical with id ${id} not found`);
    }

    if (doc.serverId) {
      await this.createOutboxEntry('DELETE', 'inventory_chemicals', doc.id, {
        id: doc.serverId,
      });
    }

    await doc.remove();
    this.syncEngine.fullSync();
  }
}
