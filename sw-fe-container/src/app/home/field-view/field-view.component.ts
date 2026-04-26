import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { Field } from '../../models/field';
import { Event } from '../../models/event';
import { FertiliserApplication } from '../../models/fertiliser-application';
import { OrganicManureApplication } from '../../models/organic-manure-application';

@Component({
  selector: 'app-field-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  providers: [DatePipe],
  templateUrl: './field-view.component.html',
  styleUrl: './field-view.component.css'
})
export class FieldViewComponent implements OnInit {
  fieldId: number | string = 0;
  field: Field | undefined;
  events: Event[] = [];

  showFertiliserForm: boolean = false;
  newFertiliser: Partial<FertiliserApplication> & { date: string, description: string } = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    fertiliser_type: '',
    amount_applied: 0,
    nitrogen_content: 0,
    phosphorus_content: 0,
    is_protected_urea: false,
    buffer_zone_confirmed: false
  };
  fertiliserApplications: FertiliserApplication[] = [];

  showSprayingForm: boolean = false;
  newSpraying: Partial<Event> = {
    date: new Date().toISOString().split('T')[0],
    event_type: 'Spraying',
    description: '',
    mapp_number: '',
    eppo_code: '',
    bbch_growth_stage: ''
  };

  showOrganicManureForm: boolean = false;
  newOrganicManure: Partial<OrganicManureApplication> & { date: string, description: string } = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    manure_type: '',
    volume_applied_m3_per_ha: 0,
    weight_applied_tonnes_per_ha: 0,
    nitrogen_content_kg_per_unit: 0,
    is_lesse_applied: false,
    weather_conditions_confirmed: false,
    buffer_zone_distance_meters: 10
  };
  organicManureApplications: OrganicManureApplication[] = [];


  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('fieldId');
      if (id) {
        this.fieldId = isNaN(+id) ? id : +id;
        this.loadFieldDetails();
        this.loadEvents();
      }
    });
  }

  loadFieldDetails(): void {
    this.farmService.getField(this.fieldId).subscribe(field => {
      this.field = field;
    });
  }


  loadEvents(): void {
    this.farmService.getEvents().subscribe(allEvents => {
      this.events = allEvents.filter(e => e.field_id === this.fieldId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    this.farmService.getFertiliserApplications().subscribe(apps => {
      this.fertiliserApplications = apps;
    });
    this.farmService.getOrganicManureApplications().subscribe(apps => {
      this.organicManureApplications = apps;
    });
  }

  getOrganicManureAppForEvent(eventId: number | string): OrganicManureApplication | undefined {
    return this.organicManureApplications.find(oma => oma.event_id === eventId);
  }

  getFertiliserAppForEvent(eventId: number | string): FertiliserApplication | undefined {
    return this.fertiliserApplications.find(fa => fa.event_id === eventId);
  }

  toggleFertiliserForm(): void {
    this.showFertiliserForm = !this.showFertiliserForm;
  }

  toggleSprayingForm(): void {
    this.showSprayingForm = !this.showSprayingForm;
  }

  toggleOrganicManureForm(): void {
    this.showOrganicManureForm = !this.showOrganicManureForm;
  }

  submitFertiliserApplication(): void {
    if (!this.newFertiliser.fertiliser_type || !this.newFertiliser.amount_applied || !this.newFertiliser.date) return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Fertiliser',
      description: this.newFertiliser.description || `Applied ${this.newFertiliser.amount_applied} of ${this.newFertiliser.fertiliser_type}`,
      date: this.newFertiliser.date
    };

    // First create the event
    this.farmService.addEvent(event as Event).subscribe(createdEvent => {
      const application: Omit<FertiliserApplication, 'id'> = {
        event_id: createdEvent.id!,
        fertiliser_type: this.newFertiliser.fertiliser_type!,
        amount_applied: this.newFertiliser.amount_applied!,
        nitrogen_content: this.newFertiliser.nitrogen_content,
        phosphorus_content: this.newFertiliser.phosphorus_content,
        is_protected_urea: this.newFertiliser.is_protected_urea,
        buffer_zone_confirmed: this.newFertiliser.buffer_zone_confirmed,
        evidence_of_control: this.newFertiliser.evidence_of_control
      };

      // Then create the fertiliser application
      this.farmService.addFertiliserApplication(application as FertiliserApplication).subscribe(() => {
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
          buffer_zone_confirmed: false
        };
      });
    });
  }

  submitSprayingRecord(): void {
    if (!this.newSpraying.date || !this.newSpraying.mapp_number) return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Spraying',
      description: this.newSpraying.description || `Pesticide application (MAPP: ${this.newSpraying.mapp_number})`,
      date: this.newSpraying.date,
      mapp_number: this.newSpraying.mapp_number,
      eppo_code: this.newSpraying.eppo_code,
      bbch_growth_stage: this.newSpraying.bbch_growth_stage
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
        bbch_growth_stage: ''
      };
    });
  }

  getEventIcon(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest')) return 'agriculture';
    if (type.includes('fertilise') || type.includes('spray') || type.includes('water')) return 'opacity';
    if (type.includes('plant')) return 'potted_plant';
    if (type.includes('soil')) return 'science';
    return 'event';
  }

  getEventColorClass(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest')) return 'bg-secondary-container text-on-secondary-container';
    if (type.includes('fertilise') || type.includes('spray') || type.includes('water')) return 'bg-tertiary-container text-white';
    if (type.includes('plant')) return 'bg-primary-container text-white';
    if (type.includes('soil')) return 'bg-primary-container text-white';
    return 'bg-surface-variant text-on-surface';
  }

  getEventTextColorClass(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('harvest')) return 'text-secondary';
    if (type.includes('fertilise') || type.includes('spray') || type.includes('water')) return 'text-tertiary-container';
    if (type.includes('plant')) return 'text-primary';
    if (type.includes('soil')) return 'text-primary-container';
    return 'text-on-surface';
  }

  submitOrganicManureApplication(): void {
    if (!this.newOrganicManure.manure_type || !this.newOrganicManure.date) return;

    const event: Omit<Event, 'id'> = {
      field_id: this.fieldId,
      event_type: 'Organic Manure',
      description: this.newOrganicManure.description || `Applied ${this.newOrganicManure.manure_type}`,
      date: this.newOrganicManure.date
    };

    this.farmService.addEvent(event as Event).subscribe(createdEvent => {
      const application: Omit<OrganicManureApplication, 'id'> = {
        event_id: createdEvent.id!,
        manure_type: this.newOrganicManure.manure_type!,
        volume_applied_m3_per_ha: this.newOrganicManure.volume_applied_m3_per_ha,
        weight_applied_tonnes_per_ha: this.newOrganicManure.weight_applied_tonnes_per_ha,
        nitrogen_content_kg_per_unit: this.newOrganicManure.nitrogen_content_kg_per_unit,
        is_lesse_applied: this.newOrganicManure.is_lesse_applied,
        weather_conditions_confirmed: this.newOrganicManure.weather_conditions_confirmed,
        buffer_zone_distance_meters: this.newOrganicManure.buffer_zone_distance_meters
      };

      this.farmService.addOrganicManureApplication(application as OrganicManureApplication).subscribe(() => {
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
          buffer_zone_distance_meters: 10
        };
      }, error => {
         // Error handled by interceptor or shown via alert
         alert("Validation failed: " + (error.error?.message || error.message || "Unknown error"));
      });
    });
  }
}
