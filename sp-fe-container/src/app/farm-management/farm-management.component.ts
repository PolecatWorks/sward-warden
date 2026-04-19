import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-farm-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-management.component.html',
  styleUrl: './farm-management.component.css'
})
export class FarmManagementComponent implements OnInit {
  farms$!: Observable<Farm[]>;
  fields$!: Observable<Field[]>;
  events$!: Observable<Event[]>;

  farmForm: FormGroup;
  fieldForm: FormGroup;
  eventForm: FormGroup;

  constructor(
    private farmService: FarmManagementService,
    private fb: FormBuilder
  ) {
    this.farmForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required]
    });

    this.fieldForm = this.fb.group({
      name: ['', Validators.required],
      area_hectares: [0, [Validators.required, Validators.min(0.1)]]
    });

    this.eventForm = this.fb.group({
      event_type: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.farms$ = this.farmService.getFarms();
    this.fields$ = this.farmService.getFields();
    this.events$ = this.farmService.getEvents();
  }

  onSubmitFarm(): void {
    if (this.farmForm.valid) {
      const newFarm: Farm = {
        id: Math.floor(Math.random() * 10000),
        user_id: 1, // hardcoded for demo
        name: this.farmForm.value.name,
        location: this.farmForm.value.location
      };
      this.farmService.addFarm(newFarm).subscribe(() => {
        this.farms$ = this.farmService.getFarms();
        this.farmForm.reset();
      });
    }
  }

  onSubmitField(): void {
    if (this.fieldForm.valid) {
      const newField: Field = {
        id: Math.floor(Math.random() * 10000),
        farm_id: 1, // hardcoded for demo
        name: this.fieldForm.value.name,
        area_hectares: this.fieldForm.value.area_hectares
      };
      this.farmService.addField(newField).subscribe(() => {
        this.fields$ = this.farmService.getFields();
        this.fieldForm.reset();
      });
    }
  }

  onSubmitEvent(): void {
    if (this.eventForm.valid) {
      const newEvent: Event = {
        id: Math.floor(Math.random() * 10000),
        field_id: 1, // hardcoded for demo
        event_type: this.eventForm.value.event_type,
        description: this.eventForm.value.description,
        date: this.eventForm.value.date
      };
      this.farmService.addEvent(newEvent).subscribe(() => {
        this.events$ = this.farmService.getEvents();
        this.eventForm.reset();
      });
    }
  }
}
