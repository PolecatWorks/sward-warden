import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmManagementService } from '../services/farm-management.service';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-farm-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farm-management.component.html',
  styleUrl: './farm-management.component.css'
})
export class FarmManagementComponent implements OnInit {
  farms$!: Observable<Farm[]>;
  fields$!: Observable<Field[]>;
  events$!: Observable<Event[]>;

  constructor(private farmService: FarmManagementService) {}

  ngOnInit(): void {
    this.farms$ = this.farmService.getFarms();
    this.fields$ = this.farmService.getFields();
    this.events$ = this.farmService.getEvents();
  }
}
