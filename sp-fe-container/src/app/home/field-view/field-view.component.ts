import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { Field } from '../../models/field';
import { Event } from '../../models/event';

@Component({
  selector: 'app-field-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './field-view.component.html',
  styleUrl: './field-view.component.css'
})
export class FieldViewComponent implements OnInit {
  fieldId: number = 0;
  field: Field | undefined;
  events: Event[] = [];

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('fieldId');
      if (id) {
        this.fieldId = +id;
        this.loadFieldDetails();
        this.loadEvents();
      }
    });
  }

  loadFieldDetails(): void {
    this.farmService.getFields().subscribe(allFields => {
      this.field = allFields.find(f => f.id === this.fieldId);
    });
  }

  loadEvents(): void {
    this.farmService.getEvents().subscribe(allEvents => {
      this.events = allEvents.filter(e => e.field_id === this.fieldId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
}
