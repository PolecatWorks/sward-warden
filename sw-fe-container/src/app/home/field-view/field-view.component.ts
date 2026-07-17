import { HostListener } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { Field } from '../../models/field';
import { Event } from '../../models/event';
import { FertiliserApplication } from '../../models/fertiliser-application';
import { OrganicManureApplication } from '../../models/organic-manure-application';
import { Farm } from '../../models/farm';
import { FieldMapEditorComponent } from '../../shared/components/field-map-editor/field-map-editor.component';
import { LoggerService } from '../../services/logger.service';
import { SpatialService } from '../../services/spatial.service';

@Component({
  selector: 'app-field-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FieldMapEditorComponent],
  providers: [DatePipe],
  templateUrl: './field-view.component.html',
  styleUrl: './field-view.component.css',
})
export class FieldViewComponent implements OnInit {
  fieldId: number = 0;
  field: Field | undefined;
  events: Event[] = [];

  editingEventId: number | null = null;
  editFormData: any = {};

  showEditFieldModal: boolean = false;
  editFieldName: string = '';
  editFieldArea: number = 0;
  editFieldLandUse: string = 'grassland';
  editFieldFarmId: number = 0;
  editFieldGeometry_geojson: string = '';
  originalEditFieldName: string = '';
  originalEditFieldArea: number = 0;
  originalEditFieldLandUse: string = 'grassland';
  originalEditFieldFarmId: number = 0;
  originalEditFieldGeometry_geojson: string = '';
  farms: Farm[] = [];
  isSaving: boolean = false;
  isCalculatingArea: boolean = false;
  errorMessage: string | null = null;
  showDeleteConfirm: boolean = false;

  showFertiliserForm: boolean = false;
  newFertiliser: Partial<FertiliserApplication> & {
    date: string;
    description: string;
  } = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    fertiliser_type: '',
    amount_applied: 0,
    nitrogen_content: 0,
    phosphorus_content: 0,
    is_protected_urea: false,
    buffer_zone_confirmed: false,
  };
  fertiliserApplications: FertiliserApplication[] = [];

  showSprayingForm: boolean = false;
  newSpraying: Partial<Event> = {
    date: new Date().toISOString().split('T')[0],
    event_type: 'Spraying',
    description: '',
    mapp_number: '',
    eppo_code: '',
    bbch_growth_stage: '',
  };

  showOrganicManureForm: boolean = false;
  newOrganicManure: Partial<OrganicManureApplication> & {
    date: string;
    description: string;
  } = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    manure_type: '',
    volume_applied_m3_per_ha: 0,
    weight_applied_tonnes_per_ha: 0,
    nitrogen_content_kg_per_unit: 0,
    is_lesse_applied: false,
    weather_conditions_confirmed: false,
    buffer_zone_distance_meters: 10,
    equipment_used: '',
    lesse_exemption_reason: '',
  };
  organicManureApplications: OrganicManureApplication[] = [];

  showPlantingForm: boolean = false;
  newPlanting = {
    date: new Date().toISOString().split('T')[0],
    crop: '',
    variety: '',
    description: '',
  };

  showGeneralEventForm: boolean = false;
  generalEvent = {
    event_type: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  };

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService,
    private datePipe: DatePipe,
    private router: Router,
    private logger: LoggerService,
    private spatialService: SpatialService,
  ) {}

  @HostListener('document:keydown.escape', ['$event'])
  // PRD Reference: 0003
  handleEscape(event: KeyboardEvent) {
    if (this.showEditFieldModal) this.closeEditFieldModal();
    if (this.showFertiliserForm) this.showFertiliserForm = false;
    if (this.showSprayingForm) this.showSprayingForm = false;
    if (this.showOrganicManureForm) this.showOrganicManureForm = false;
    if (this.showPlantingForm) this.showPlantingForm = false;
    if (this.showGeneralEventForm) this.showGeneralEventForm = false;
    if (this.editingEventId !== null) this.cancelEdit();
  }

  // PRD Reference: 0003
  ngOnInit(): void {
    this.loadFarms();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('fieldId');
      if (id) {
        this.fieldId = +id;
        this.loadFieldDetails();
        this.loadEvents();
      }
    });
  }

  // PRD Reference: 0003
  loadFieldDetails(): void {
    this.farmService.getField(this.fieldId).subscribe((field) => {
      this.field = field;
      if (this.router.url.endsWith('/edit')) {
        this.openEditFieldModal();
      }
    });
  }

  // PRD Reference: 0003
  confirmDelete(): void {
    if (!this.fieldId) return;
    this.isSaving = true;
    this.farmService.deleteEntity('fields', this.fieldId).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/fields']);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Failed to delete field. Please try again.';
        this.logger.error('Error deleting field:', err);
      },
    });
  }

  // PRD Reference: 0003
  loadFarms(): void {
    this.farmService.getFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
      },
      error: (err) => {
        this.logger.error('Error loading farms:', err);
      },
    });
  }

  // PRD Reference: 0003
  openEditFieldModal(): void {
    if (!this.field) return;

    this.editFieldName = this.field.name;
    this.editFieldArea = this.field.area_hectares;
    this.editFieldLandUse = this.field.land_use || 'grassland';
    this.editFieldFarmId = this.field.farm_id;
    this.editFieldGeometry_geojson = this.field.geometry_geojson || '';
    this.originalEditFieldName = this.field.name;
    this.originalEditFieldArea = Number(this.field.area_hectares) || 0;
    this.originalEditFieldLandUse = this.field.land_use || 'grassland';
    this.originalEditFieldFarmId = this.field.farm_id;
    this.originalEditFieldGeometry_geojson = this.field.geometry_geojson || '';
    this.errorMessage = null;
    this.showEditFieldModal = true;
  }

  // PRD Reference: 0003
  hasEditChanges(): boolean {
    return (
      this.editFieldName !== this.originalEditFieldName ||
      // PRD Reference: 0003
      Number(this.editFieldArea) !== this.originalEditFieldArea ||
      this.editFieldLandUse !== this.originalEditFieldLandUse ||
      this.editFieldFarmId !== this.originalEditFieldFarmId ||
      this.editFieldGeometry_geojson !== this.originalEditFieldGeometry_geojson
    );
  }

  // PRD Reference: 0008
  calculateAreaFromPolygon(): void {
    if (!this.editFieldGeometry_geojson) return;

    this.isCalculatingArea = true;
    this.spatialService.calculateAreaFromPolygon(this.editFieldGeometry_geojson).subscribe({
      next: (response) => {
        const hectares = response.area_sq_meters / 10000.0;
        this.editFieldArea = Number(hectares.toFixed(2));
        this.isCalculatingArea = false;
      },
      error: (err) => {
        this.logger.error('Error calculating area:', err);
        this.isCalculatingArea = false;
      }
    });
  }

  // PRD Reference: 0003
  closeEditFieldModal(): void {
    this.showEditFieldModal = false;
    this.editFieldName = '';
    this.editFieldArea = 0;
    this.editFieldLandUse = 'grassland';
    this.editFieldFarmId = 0;
    this.editFieldGeometry_geojson = '';
    this.errorMessage = null;
    if (this.router.url.endsWith('/edit')) {
      this.router.navigate(['/fields', this.fieldId]);
    }
  }

  // PRD Reference: 0003
  editField(): void {
    if (
      !this.field ||
      !this.editFieldName ||
      this.editFieldArea <= 0 ||
      !this.editFieldFarmId ||
      !this.hasEditChanges()
    ) {
      this.errorMessage = 'Please enter valid details.';
      return;
    }

    const updatedData: Partial<Field> = {
      name: this.editFieldName,
      area_hectares: this.editFieldArea,
      land_use: this.editFieldLandUse,
      farm_id: +this.editFieldFarmId,
      geometry_geojson: this.editFieldGeometry_geojson.trim() || undefined,
    };

    this.isSaving = true;
    this.farmService.updateField(this.fieldId, updatedData).subscribe({
      next: () => {
        this.closeEditFieldModal();
        this.isSaving = false;
        this.loadFieldDetails();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update field. Please try again.';
        this.isSaving = false;
        this.logger.error('Error updating field:', err);
      },
    });
  }

  // PRD Reference: 0003
  loadEvents(): void {
    this.farmService.getEvents().subscribe((allEvents) => {
      this.events = allEvents
        .filter((e) => e.field_id === this.fieldId)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    });
    this.farmService.getFertiliserApplications().subscribe((apps) => {
      this.fertiliserApplications = apps;
    });
    this.farmService.getOrganicManureApplications().subscribe((apps) => {
      this.organicManureApplications = apps;
    });
  }

  // PRD Reference: 0003
  getOrganicManureAppForEvent(
    eventId: number,
  ): OrganicManureApplication | undefined {
    return this.organicManureApplications.find(
      (oma) => oma.event_id === eventId,
    );
  }

  // PRD Reference: 0003
  startEdit(event: Event): void {
    this.editingEventId = event.id || null;
    this.editFormData = { ...event };

    if (event.event_type.toLowerCase().includes('fertilise')) {
      const fa = this.getFertiliserAppForEvent(event.id!);
      if (fa) {
        this.editFormData.fertiliserApplication = { ...fa };
      }
    } else if (
      event.event_type.toLowerCase().includes('organic manure') ||
      event.event_type.toLowerCase().includes('slurry')
    ) {
      const oma = this.getOrganicManureAppForEvent(event.id!);
      if (oma) {
        this.editFormData.organicManureApplication = { ...oma };
      }
    } else if (event.event_type === 'Planting') {
      if (!this.editFormData.mapp_number || !this.editFormData.eppo_code) {
        const match = (event.description || '').match(
          /Planted\s+(.*?)\s+\(Variety:\s+(.*?)\)/,
        );
        if (match) {
          this.editFormData.mapp_number = match[1];
          this.editFormData.eppo_code = match[2];
          this.editFormData.description = ''; // Revert auto-generated description to empty notes
        }
      }
    }
  }

  // PRD Reference: 0003
  cancelEdit(): void {
    this.editingEventId = null;
    this.editFormData = {};
  }

  // PRD Reference: 0003
  saveEdit(event: Event): void {
    if (!event.id) return;
    const localId = event.id.toString();

    const eventUpdates = {
      description: this.editFormData.description,
      date: this.editFormData.date,
      mapp_number: this.editFormData.mapp_number,
      eppo_code: this.editFormData.eppo_code,
      bbch_growth_stage: this.editFormData.bbch_growth_stage,
    };

    this.farmService.updateEvent(localId, eventUpdates).subscribe(() => {
      let dependentRequests = 0;
      let completedRequests = 0;

      const checkCompletion = () => {
        completedRequests++;
        if (completedRequests === dependentRequests) {
          this.loadEvents();
          this.cancelEdit();
        }
      };

      if (
        event.event_type.toLowerCase().includes('fertilise') &&
        this.editFormData.fertiliserApplication
      ) {
        dependentRequests++;
        const faId = this.editFormData.fertiliserApplication.localId ?? this.editFormData.fertiliserApplication.id;
        const serverId = this.editFormData.fertiliserApplication.serverId;
        this.farmService
          .updateFertiliserApplication(
            faId!.toString(),
            serverId,
            this.editFormData.fertiliserApplication,
          )
          .subscribe(checkCompletion);
      } else if (
        (event.event_type.toLowerCase().includes('organic manure') ||
          event.event_type.toLowerCase().includes('slurry')) &&
        this.editFormData.organicManureApplication
      ) {
        dependentRequests++;
        const omaId = this.editFormData.organicManureApplication.id;
        const serverId = this.editFormData.organicManureApplication.serverId; // Assuming serverId is mapped
        this.farmService
          .updateOrganicManureApplication(
            omaId.toString(),
            serverId,
            this.editFormData.organicManureApplication,
          )
          .subscribe(checkCompletion);
      } else {
        this.loadEvents();
        this.cancelEdit();
      }
    });
  }

  // PRD Reference: 0003
  getFertiliserAppForEvent(eventId: number): FertiliserApplication | undefined {
    return this.fertiliserApplications.find((fa) => fa.event_id === eventId);
  }

  // PRD Reference: 0003
  toggleFertiliserForm(): void {
    this.showFertiliserForm = !this.showFertiliserForm;
  }

  // PRD Reference: 0003
  toggleSprayingForm(): void {
    this.showSprayingForm = !this.showSprayingForm;
  }

  // PRD Reference: 0003
  showNapRulesModal: boolean = false;

  toggleOrganicManureForm(): void {
    this.showOrganicManureForm = !this.showOrganicManureForm;
  }

  toggleNapRulesModal(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showNapRulesModal = !this.showNapRulesModal;
  }

  // PRD Reference: 0003
  submitFertiliserApplication(): void {
    if (
      !this.newFertiliser.fertiliser_type ||
      !this.newFertiliser.amount_applied ||
      !this.newFertiliser.date
    )
      return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Fertiliser',
      description:
        this.newFertiliser.description ||
        `Applied ${this.newFertiliser.amount_applied} of ${this.newFertiliser.fertiliser_type}`,
      date: this.newFertiliser.date,
    };

    // First create the event
    this.farmService.addEvent(event as Event).subscribe((createdEvent) => {
      const application: Omit<FertiliserApplication, 'id'> = {
        event_id: createdEvent.id!,
        fertiliser_type: this.newFertiliser.fertiliser_type!,
        amount_applied: this.newFertiliser.amount_applied!,
        nitrogen_content: this.newFertiliser.nitrogen_content,
        phosphorus_content: this.newFertiliser.phosphorus_content,
        is_protected_urea: this.newFertiliser.is_protected_urea,
        buffer_zone_confirmed: this.newFertiliser.buffer_zone_confirmed,
        evidence_of_control: this.newFertiliser.evidence_of_control,
      };

      // Then create the fertiliser application
      this.farmService
        .addFertiliserApplication(application as FertiliserApplication)
        .subscribe(() => {
          this.loadEvents();
          this.showFertiliserForm = false;
          this.newFertiliser = {
            date: new Date().toISOString().split('T')[0],
            description: '',
            fertiliser_type: '',
            amount_applied: 0,
            nitrogen_content: 0,
            phosphorus_content: 0,
            is_protected_urea: false,
            buffer_zone_confirmed: false,
          };
        });
    });
  }

  // PRD Reference: 0003
  submitSprayingRecord(): void {
    if (
      !this.newSpraying.date ||
      !this.newSpraying.mapp_number ||
      !this.newSpraying.eppo_code ||
      !this.newSpraying.bbch_growth_stage
    )
      return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Spraying',
      description:
        this.newSpraying.description ||
        `Pesticide application (MAPP: ${this.newSpraying.mapp_number})`,
      date: this.newSpraying.date,
      mapp_number: this.newSpraying.mapp_number,
      eppo_code: this.newSpraying.eppo_code,
      bbch_growth_stage: this.newSpraying.bbch_growth_stage,
    };

    this.farmService.addEvent(event as Event).subscribe(() => {
      this.loadEvents();
      this.showSprayingForm = false;
      this.newSpraying = {
        date: new Date().toISOString().split('T')[0],
        event_type: 'Spraying',
        description: '',
        mapp_number: '',
        eppo_code: '',
        bbch_growth_stage: '',
      };
    });
  }

  // PRD Reference: 0003
  getEventIcon(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest')) return 'agriculture';
    if (
      type.includes('fertilise') ||
      type.includes('spray') ||
      type.includes('water')
    )
      return 'opacity';
    if (type.includes('plant')) return 'potted_plant';
    if (type.includes('soil')) return 'science';
    return 'event';
  }

  // PRD Reference: 0003
  getEventColorClass(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest'))
      return 'bg-secondary-container text-on-secondary-container';
    if (
      type.includes('fertilise') ||
      type.includes('spray') ||
      type.includes('water')
    )
      return 'bg-tertiary-container text-white';
    if (type.includes('plant')) return 'bg-primary-container text-white';
    if (type.includes('soil')) return 'bg-primary-container text-white';
    return 'bg-surface-variant text-on-surface';
  }

  // PRD Reference: 0003
  getEventTextColorClass(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest')) return 'text-secondary';
    if (
      type.includes('fertilise') ||
      type.includes('spray') ||
      type.includes('water')
    )
      return 'text-tertiary-container';
    if (type.includes('plant')) return 'text-primary';
    if (type.includes('soil')) return 'text-primary-container';
    return 'text-on-surface';
  }

  // PRD Reference: 0003
  submitOrganicManureApplication(): void {
    if (!this.newOrganicManure.manure_type || !this.newOrganicManure.date)
      return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Organic Manure',
      description:
        this.newOrganicManure.description ||
        `Applied ${this.newOrganicManure.manure_type}`,
      date: this.newOrganicManure.date,
    };

    this.farmService.addEvent(event as Event).subscribe((createdEvent) => {
      const application: Omit<OrganicManureApplication, 'id'> = {
        event_id: createdEvent.id!,
        manure_type: this.newOrganicManure.manure_type!,
        volume_applied_m3_per_ha:
          this.newOrganicManure.volume_applied_m3_per_ha,
        weight_applied_tonnes_per_ha:
          this.newOrganicManure.weight_applied_tonnes_per_ha,
        nitrogen_content_kg_per_unit:
          this.newOrganicManure.nitrogen_content_kg_per_unit,
        is_lesse_applied: this.newOrganicManure.is_lesse_applied,
        weather_conditions_confirmed:
          this.newOrganicManure.weather_conditions_confirmed,
        buffer_zone_distance_meters:
          this.newOrganicManure.buffer_zone_distance_meters,
        equipment_used: this.newOrganicManure.equipment_used,
        lesse_exemption_reason: this.newOrganicManure.is_lesse_applied
          ? ''
          : this.newOrganicManure.lesse_exemption_reason,
      };

      this.farmService
        .addOrganicManureApplication(application as OrganicManureApplication)
        .subscribe(
          () => {
            this.loadEvents();
            this.showOrganicManureForm = false;
            this.newOrganicManure = {
              date: new Date().toISOString().split('T')[0],
              description: '',
              manure_type: '',
              volume_applied_m3_per_ha: 0,
              weight_applied_tonnes_per_ha: 0,
              nitrogen_content_kg_per_unit: 0,
              is_lesse_applied: false,
              weather_conditions_confirmed: false,
              buffer_zone_distance_meters: 10,
              equipment_used: '',
              lesse_exemption_reason: '',
            };
          },
          (error) => {
            // Error handled by interceptor or shown via alert
            // PRD Reference: 0003
            alert(
              'Validation failed: ' +
                (error.error?.message || error.message || 'Unknown error'),
            );
          },
        );
    });
  }

  // PRD Reference: 0003
  togglePlantingForm(): void {
    this.showPlantingForm = !this.showPlantingForm;
  }

  // PRD Reference: 0003
  toggleGeneralEventForm(): void {
    this.showGeneralEventForm = !this.showGeneralEventForm;
  }

  // PRD Reference: 0003
  onGeneralEventTypeChange(type: string): void {
    if (type === 'Planting') {
      this.showGeneralEventForm = false;
      this.showPlantingForm = true;
    } else if (type === 'Fertiliser') {
      this.showGeneralEventForm = false;
      this.showFertiliserForm = true;
    } else if (type === 'Spraying') {
      this.showGeneralEventForm = false;
      this.showSprayingForm = true;
    } else if (type === 'Organic Manure') {
      this.showGeneralEventForm = false;
      this.showOrganicManureForm = true;
    }
  }

  // PRD Reference: 0003
  submitPlantingRecord(): void {
    if (
      !this.newPlanting.crop ||
      !this.newPlanting.variety ||
      !this.newPlanting.date
    )
      return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Planting',
      description: this.newPlanting.description || '',
      date: this.newPlanting.date,
      mapp_number: this.newPlanting.crop,
      eppo_code: this.newPlanting.variety,
    };

    this.farmService.addEvent(event as Event).subscribe(() => {
      this.loadEvents();
      this.showPlantingForm = false;
      this.newPlanting = {
        date: new Date().toISOString().split('T')[0],
        crop: '',
        variety: '',
        description: '',
      };
    });
  }

  // PRD Reference: 0003
  submitGeneralEvent(): void {
    if (
      !this.generalEvent.event_type ||
      !this.generalEvent.date ||
      !this.generalEvent.description
    )
      return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: this.generalEvent.event_type,
      description: this.generalEvent.description,
      date: this.generalEvent.date,
    };

    this.farmService.addEvent(event as Event).subscribe(() => {
      this.loadEvents();
      this.showGeneralEventForm = false;
      this.generalEvent = {
        event_type: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      };
    });
  }
}
