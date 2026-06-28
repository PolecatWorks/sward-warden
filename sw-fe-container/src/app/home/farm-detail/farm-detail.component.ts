import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { FarmManagementService } from '../../services/farm-management.service';
import { RxdbService } from '../../services/rxdb/rxdb.service';
import { LoggerService } from '../../services/logger.service';
import { Farm } from '../../models/farm';
import { Field } from '../../models/field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-farm-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './farm-detail.component.html',
  styleUrl: './farm-detail.component.css'
})
export class FarmDetailComponent implements OnInit {
  farmId!: number;
  farm: Farm | null = null;
  fields: Field[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string | null = null;

  showEditFarmModal: boolean = false;
  editFarmName: string = '';
  editFarmLocation: string = '';
  originalEditFarmName: string = '';
  originalEditFarmLocation: string = '';

  showDeleteConfirm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private farmService: FarmManagementService,
    private rxdbService: RxdbService,
    private logger: LoggerService
  ) {}


  @HostListener('document:keydown.escape', ['$event'])
  // PRD Reference: 0003
  handleEscape(event: KeyboardEvent) {
    if (this.showEditFarmModal) {
      this.closeEditFarmModal();
    }
  }

  // PRD Reference: 0003
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('farmId');
      if (idStr) {
        this.farmId = Number(idStr);
        this.loadFarmData();
      }
    });

    // Automatically reload details when local DB fallback status changes
    this.rxdbService.fallbackToRest$.subscribe(() => {
      if (this.farmId) {
        this.loadFarmData();
      }
    });
  }

  // PRD Reference: 0003
  loadFarmData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    combineLatest({
      farms: this.farmService.getFarms(),
      fields: this.farmService.getFields()
    }).subscribe({
      next: ({ farms, fields }) => {
        this.farm = farms.find(f => f.id === this.farmId) || null;
        if (!this.farm) {
          this.errorMessage = 'Farm not found.';
        } else {
          // Filter active fields belonging to this farm
          this.fields = fields.filter(f => f.farm_id === this.farmId);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load farm details. Please try again.';
        this.isLoading = false;
        this.logger.error('Error loading farm details:', err);
      }
    });
  }

  // PRD Reference: 0003
  openEditFarmModal(): void {
    if (!this.farm) return;
    this.editFarmName = this.farm.name;
    this.editFarmLocation = this.farm.location;
    this.originalEditFarmName = this.farm.name;
    this.originalEditFarmLocation = this.farm.location;
    this.errorMessage = null;
    this.showEditFarmModal = true;
  }


  // PRD Reference: 0003
  hasEditChanges(): boolean {
    return this.editFarmName !== this.originalEditFarmName ||
           this.editFarmLocation !== this.originalEditFarmLocation;
  }

  // PRD Reference: 0003
  closeEditFarmModal(): void {
    this.showEditFarmModal = false;
    this.editFarmName = '';
    this.editFarmLocation = '';
  }

  // PRD Reference: 0003
  editFarm(): void {
    if (!this.farm || !this.editFarmName || !this.editFarmLocation || !this.hasEditChanges()) {
      return;
    }

    const updatedData: Partial<Farm> = {
      name: this.editFarmName,
      location: this.editFarmLocation
    };

    this.isSaving = true;
    this.farmService.updateFarm(this.farm.id!, updatedData).subscribe({
      next: () => {
        this.closeEditFarmModal();
        this.isSaving = false;
        this.loadFarmData();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update farm. Please try again.';
        this.isSaving = false;
        this.logger.error('Error updating farm:', err);
      }
    });
  }

  // PRD Reference: 0003
  confirmDelete(): void {
    if (!this.farm) return;
    this.isSaving = true;
    this.farmService.deleteEntity('farms', this.farm.id!).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/farms']);
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete farm. Please try again.';
        this.isSaving = false;
        this.logger.error('Error deleting farm:', err);
      }
    });
  }
}
