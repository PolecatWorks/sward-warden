import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { Field } from '../../models/field';
import { Event } from '../../models/event';

@Component({
  selector: 'app-field-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './field-view.component.html',
  styleUrl: './field-view.component.css'
})
export class FieldViewComponent implements OnInit {
  fieldId: number = 0;
  field: Field | undefined;
  events: Event[] = [];

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService
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
      this.events = allEvents.filter(e => e.field_id === this.fieldId);
    });
  }
}
