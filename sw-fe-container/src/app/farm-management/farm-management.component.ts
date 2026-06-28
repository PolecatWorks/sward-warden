import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-farm-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-management.component.html',
  styleUrl: './farm-management.component.css',
})
export class FarmManagementComponent implements OnInit, OnDestroy {
  users$!: Observable<User[]>;
  farms$!: Observable<Farm[]>;
  fields$!: Observable<Field[]>;
  events$!: Observable<Event[]>;

  currentUser: User | null = null;
  private farmsSubscription?: Subscription;

  farmForm: FormGroup;
  fieldForm: FormGroup;
  eventForm: FormGroup;

  constructor(
    private farmService: FarmManagementService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.farmForm = this.fb.group({
      user_id: ['', Validators.required],
      name: ['', Validators.required],
      location: ['', Validators.required],
    });

    this.fieldForm = this.fb.group({
      farm_id: ['', Validators.required],
      name: ['', Validators.required],
      area_hectares: [0, [Validators.required, Validators.min(0.1)]],
    });

    this.eventForm = this.fb.group({
      field_id: ['', Validators.required],
      event_type: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
    });
  }

  // PRD Reference: 0003
  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.farmService.getUser(userId).subscribe((user) => {
        this.currentUser = user;
        this.loadData();
      });
    } else {
      this.loadData();
    }
  }

  // PRD Reference: 0003
  loadData(): void {
    this.users$ = this.farmService.getUsers();
    this.farms$ = this.farmService.getFarms();
    this.fields$ = this.farmService.getFields();
    this.events$ = this.farmService.getEvents();

    if (this.farmsSubscription) {
      this.farmsSubscription.unsubscribe();
    }

    this.farmsSubscription = this.farms$.subscribe((farms) => {
      const farmIdControl = this.fieldForm.get('farm_id');
      if (farmIdControl) {
        const isAdmin = this.currentUser?.role === 'admin';
        if (!isAdmin && farms.length === 0) {
          farmIdControl.clearValidators();
        } else {
          farmIdControl.setValidators([Validators.required]);
        }
        farmIdControl.updateValueAndValidity();
      }
    });
  }

  // PRD Reference: 0003
  ngOnDestroy(): void {
    if (this.farmsSubscription) {
      this.farmsSubscription.unsubscribe();
    }
  }

  // PRD Reference: 0003
  onSubmitFarm(): void {
    if (this.farmForm.valid) {
      const newFarm: Farm = {
        id: Math.floor(Math.random() * 10000),
        user_id: Number(this.farmForm.value.user_id),
        name: this.farmForm.value.name,
        location: this.farmForm.value.location,
      };
      this.farmService.addFarm(newFarm).subscribe(() => {
        this.loadData();
        this.farmForm.reset();
      });
    }
  }

  // PRD Reference: 0003
  onSubmitField(): void {
    if (this.fieldForm.valid) {
      const formValue = this.fieldForm.value;

      if (!formValue.farm_id && this.currentUser) {
        const newFarm: Farm = {
          id: Math.floor(Math.random() * 10000),
          user_id: this.currentUser.id,
          name: 'Default Farm',
          location: 'Default Location',
        };

        this.farmService
          .addFarm(newFarm)
          .pipe(
            switchMap((createdFarm) => {
              const newField: Field = {
                id: Math.floor(Math.random() * 10000),
                farm_id: createdFarm.id as number,
                name: formValue.name,
                area_hectares: formValue.area_hectares,
              };
              return this.farmService.addField(newField);
            }),
          )
          .subscribe(() => {
            this.loadData();
            this.fieldForm.reset();
          });
      } else {
        const newField: Field = {
          id: Math.floor(Math.random() * 10000),
          farm_id: Number(formValue.farm_id),
          name: formValue.name,
          area_hectares: formValue.area_hectares,
        };
        this.farmService.addField(newField).subscribe(() => {
          this.loadData();
          this.fieldForm.reset();
        });
      }
    }
  }

  // PRD Reference: 0003
  onSubmitEvent(): void {
    if (this.eventForm.valid) {
      const newEvent: Event = {
        id: Math.floor(Math.random() * 10000),
        field_id: Number(this.eventForm.value.field_id),
        event_type: this.eventForm.value.event_type,
        description: this.eventForm.value.description,
        date: this.eventForm.value.date,
      };
      this.farmService.addEvent(newEvent).subscribe(() => {
        this.loadData();
        this.eventForm.reset();
      });
    }
  }
}
