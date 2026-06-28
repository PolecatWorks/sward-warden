import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { InventoryChemicalsService } from '../services/inventory-chemicals.service';
import { InventoryChemicalDocType } from '../services/rxdb/schemas';

@Component({
  standalone: true,
  selector: 'app-chemical-pesticide-inventory',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './chemical-pesticide-inventory.component.html',
  styleUrl: './chemical-pesticide-inventory.component.css',
})
export class ChemicalPesticideInventoryComponent implements OnInit {
  chemicals$!: Observable<InventoryChemicalDocType[]>;
  showForm = false;
  chemicalForm!: FormGroup;
  editingId: string | null = null;

  constructor(
    private inventoryService: InventoryChemicalsService,
    private fb: FormBuilder,
  ) {}

  // PRD Reference: 0006
  ngOnInit(): void {
    this.chemicals$ = this.inventoryService.getChemicals();
    this.initForm();
  }

  // PRD Reference: 0006
  initForm(): void {
    this.chemicalForm = this.fb.group({
      name: ['', Validators.required],
      mapp_number: ['', Validators.required],
      active_ingredient: [''],
      quantity_on_hand: [null, [Validators.min(0)]],
      unit: ['Litres'],
      farm_id: [null],
    });
  }

  // PRD Reference: 0006
  openAddForm(): void {
    this.showForm = true;
    this.editingId = null;
    this.chemicalForm.reset({ unit: 'Litres' });
  }

  // PRD Reference: 0006
  openEditForm(chemical: InventoryChemicalDocType): void {
    this.showForm = true;
    this.editingId = chemical.id;
    this.chemicalForm.patchValue({
      name: chemical.name,
      mapp_number: chemical.mapp_number,
      active_ingredient: chemical.active_ingredient,
      quantity_on_hand: chemical.quantity_on_hand,
      unit: chemical.unit,
      farm_id: chemical.farm_id,
    });
  }

  // PRD Reference: 0006
  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  // PRD Reference: 0006
  async submitForm(): Promise<void> {
    if (this.chemicalForm.valid) {
      try {
        if (this.editingId) {
          await this.inventoryService.updateChemical(
            this.editingId,
            this.chemicalForm.value,
          );
        } else {
          await this.inventoryService.addChemical(this.chemicalForm.value);
        }
        this.closeForm();
      } catch (err) {
        console.error('Failed to save chemical', err);
      }
    }
  }

  // PRD Reference: 0006
  async deleteChemical(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await this.inventoryService.deleteChemical(id);
      } catch (err) {
        console.error('Failed to delete chemical', err);
      }
    }
  }
}
