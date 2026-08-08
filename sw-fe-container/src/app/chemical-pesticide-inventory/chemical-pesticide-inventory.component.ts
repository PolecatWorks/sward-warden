import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { InventoryChemicalsService } from '../services/inventory-chemicals.service';
import { InventoryChemicalDocType } from '../services/rxdb/schemas';
import { LoggerService } from '../services/logger.service';

@Component({
  standalone: true,
  selector: 'app-chemical-pesticide-inventory',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './chemical-pesticide-inventory.component.html',
  styleUrl: './chemical-pesticide-inventory.component.css',
})
export class ChemicalPesticideInventoryComponent implements OnInit, OnDestroy {
  chemicals$!: Observable<InventoryChemicalDocType[]>;
  filteredChemicals$!: Observable<InventoryChemicalDocType[]>;
  showForm = false;
  chemicalForm!: FormGroup;
  editingId: string | null = null;

  searchQuery$ = new BehaviorSubject<string>('');
  private subs = new Subscription();

  get searchQuery(): string {
    return this.searchQuery$.value;
  }

  set searchQuery(value: string) {
    this.searchQuery$.next(value);
  }

  constructor(
    private inventoryService: InventoryChemicalsService,
    private fb: FormBuilder,
    private logger: LoggerService,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  // PRD Reference: 0006
  ngOnInit(): void {
    this.chemicals$ = this.inventoryService.getChemicals();
    this.filteredChemicals$ = combineLatest([
      this.chemicals$,
      this.searchQuery$
    ]).pipe(
      map(([chemicals, query]) => {
        if (!query.trim()) {
          return chemicals;
        }
        const lowerQuery = query.toLowerCase().trim();
        return chemicals.filter(chem => chem.name.toLowerCase().includes(lowerQuery));
      })
    );
    this.initForm();
    this.processInitialRoute();
  }

  private processInitialRoute(): void {
    this.subs.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        this.subs.add(
          this.route.url.subscribe(urlSegments => {
            const url = urlSegments.map(s => s.path).join('/');

            if (url.includes('new')) {
              this.openAddForm(true);
            } else if (id) {
              this.subs.add(
                this.chemicals$.pipe(take(1)).subscribe(chemicals => {
                  const chemical = chemicals.find(c => c.id === id);
                  if (chemical) {
                    this.openEditForm(chemical, true);
                  }
                })
              );
            }
          })
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
  openAddForm(fromRoute = false): void {
    this.showForm = true;
    this.editingId = null;
    this.chemicalForm.reset({ unit: 'Litres' });
    if (!fromRoute) {
      this.location.replaceState('/inventory/chemical/new');
    }
  }

  // PRD Reference: 0006
  openEditForm(chemical: InventoryChemicalDocType, fromRoute = false): void {
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
    if (!fromRoute) {
      this.location.replaceState(`/inventory/chemical/${chemical.id}/edit`);
    }
  }

  // PRD Reference: 0006
  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.location.replaceState('/inventory/chemical');
  }

  // PRD Reference: 0006
  async submitForm(): Promise<void> {
    if (this.chemicalForm.valid) {
      try {
        const formValue = this.chemicalForm.value;
        const sanitizedValue = {
          ...formValue,
          farm_id:
            formValue.farm_id !== null && formValue.farm_id !== ''
              ? Number(formValue.farm_id)
              : null,
          quantity_on_hand:
            formValue.quantity_on_hand !== null &&
            formValue.quantity_on_hand !== ''
              ? Number(formValue.quantity_on_hand)
              : null,
          active_ingredient: formValue.active_ingredient || null,
          unit: formValue.unit || null,
        };

        if (this.editingId) {
          await this.inventoryService.updateChemical(
            this.editingId,
            sanitizedValue,
          );
        } else {
          await this.inventoryService.addChemical(sanitizedValue);
        }
        this.closeForm();
      } catch (err) {
        this.logger.error('Failed to save chemical', err);
      }
    }
  }

  // PRD Reference: 0006
  async deleteChemical(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await this.inventoryService.deleteChemical(id);
        this.closeForm();
      } catch (err) {
        this.logger.error('Failed to delete chemical', err);
      }
    }
  }
}
