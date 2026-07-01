import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { RxdbService, SwardDatabase } from '../services/rxdb/rxdb.service';
import { InventoryStorageDocType, FarmDocType } from '../services/rxdb/schemas';
import { v4 as uuidv4 } from 'uuid';

@Component({
  standalone: true,
  selector: 'app-storage-capacity',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './storage-capacity.component.html',
  styleUrl: './storage-capacity.component.css',
})
export class StorageCapacityComponent implements OnInit, OnDestroy {
  storages: InventoryStorageDocType[] = [];
  farms: FarmDocType[] = [];

  isAdding = false;
  editingId: string | null = null;
  storageForm: FormGroup;

  private subs = new Subscription();
  private db: SwardDatabase | null = null;

  constructor(
    private rxdbService: RxdbService,
    private fb: FormBuilder,
  ) {
    this.storageForm = this.fb.group({
      name: ['', Validators.required],
      storage_type: ['liquid', Validators.required],
      capacity_volume: [0, [Validators.required, Validators.min(0.1)]],
      is_covered: [false],
      farm_id: [null],
    });
  }

  // No obvious PRD requirement
  ngOnInit() {
    this.subs.add(
      this.rxdbService.db$.subscribe((db) => {
        this.db = db;

        // Subscribe to storages
        this.subs.add(
          db.inventory_storage.find().$.subscribe((storages) => {
            this.storages = storages;
          }),
        );

        // Subscribe to farms for the dropdown
        this.subs.add(
          db.farms.find().$.subscribe((farms) => {
            this.farms = farms;
          }),
        );
      }),
    );
  }

  // No obvious PRD requirement
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // No obvious PRD requirement
  getFarmName(farmId?: number | null): string {
    if (!farmId) return 'Shared / Unassigned';
    const farm = this.farms.find((f) => f.serverId === farmId);
    return farm ? farm.name : 'Unknown Farm';
  }

  // No obvious PRD requirement
  startAdd() {
    this.isAdding = true;
    this.editingId = null;
    this.storageForm.reset({
      storage_type: 'liquid',
      capacity_volume: 0,
      is_covered: false,
      farm_id: null,
    });
  }

  // No obvious PRD requirement
  startEdit(storage: InventoryStorageDocType) {
    this.isAdding = false;
    this.editingId = storage.id;
    this.storageForm.patchValue({
      name: storage.name,
      storage_type: storage.storage_type,
      capacity_volume: storage.capacity_volume,
      is_covered: storage.is_covered,
      farm_id: storage.farm_id,
    });
  }

  // No obvious PRD requirement
  cancelForm() {
    this.isAdding = false;
    this.editingId = null;
    this.storageForm.reset();
  }

  // No obvious PRD requirement
  async saveStorage() {
    if (this.storageForm.invalid || !this.db) return;

    const val = this.storageForm.value;

    if (this.isAdding) {
      const newId = uuidv4();
      const doc: InventoryStorageDocType = {
        id: newId,
        uuid: newId,
        name: val.name,
        storage_type: val.storage_type,
        capacity_volume: Number(val.capacity_volume),
        is_covered: val.is_covered,
        farm_id: val.farm_id ? Number(val.farm_id) : null,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };

      await this.db.inventory_storage.insert(doc);
      await this.db.outbox.insert({
        id: uuidv4(),
        actionType: 'POST',
        entityType: 'inventory_storage',
        payload: JSON.stringify(doc),
        localDocId: newId,
        status: 'pending',
        retryCount: 0,
        timestamp: new Date().toISOString(),
      });
    } else if (this.editingId) {
      const doc = await this.db.inventory_storage
        .findOne(this.editingId)
        .exec();
      if (doc) {
        await doc.patch({
          name: val.name,
          storage_type: val.storage_type,
          capacity_volume: Number(val.capacity_volume),
          is_covered: val.is_covered,
          farm_id: val.farm_id ? Number(val.farm_id) : null,
          syncStatus: 'pending',
          updatedAt: new Date().toISOString(),
        });

        await this.db.outbox.insert({
          id: uuidv4(),
          actionType: 'PUT',
          entityType: 'inventory_storage',
          payload: JSON.stringify({ ...doc.toJSON(), serverId: doc.serverId }), // Ensure ID is mapped correctly for update if needed in sync engine
          localDocId: this.editingId,
          status: 'pending',
          retryCount: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.cancelForm();
  }

  // No obvious PRD requirement
  async deleteStorage(id: string) {
    if (
      !this.db ||
      !confirm('Are you sure you want to delete this storage facility?')
    )
      return;

    const doc = await this.db.inventory_storage.findOne(id).exec();
    if (doc) {
      const serverId = doc.serverId;
      await doc.remove();

      if (serverId) {
        await this.db.outbox.insert({
          id: uuidv4(),
          actionType: 'DELETE',
          entityType: 'inventory_storage',
          payload: JSON.stringify({ id: serverId }),
          localDocId: id,
          status: 'pending',
          retryCount: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
