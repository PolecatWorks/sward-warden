import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityService, Farm, Field, Event } from '../../services/entity.service';

type ExplorerTab = 'farms' | 'fields' | 'events';

@Component({
  selector: 'app-entity-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entity-explorer.html',
  styleUrl: './entity-explorer.css',
})
export class EntityExplorerComponent implements OnInit {
  private readonly entityService = inject(EntityService);

  activeTab = signal<ExplorerTab>('farms');
  farms = signal<Farm[]>([]);
  fields = signal<Field[]>([]);
  events = signal<Event[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  setTab(tab: ExplorerTab): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  loadData(): void {
    const tab = this.activeTab();
    this.loading.set(true);
    this.error.set(null);

    if (tab === 'farms') {
      this.entityService.getFarms().subscribe({
        next: (data) => {
          this.farms.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`Failed to load ${tab}`);
          this.loading.set(false);
          console.error(err);
        }
      });
    } else if (tab === 'fields') {
      this.entityService.getFields().subscribe({
        next: (data) => {
          this.fields.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`Failed to load ${tab}`);
          this.loading.set(false);
          console.error(err);
        }
      });
    } else {
      this.entityService.getEvents().subscribe({
        next: (data) => {
          this.events.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`Failed to load ${tab}`);
          this.loading.set(false);
          console.error(err);
        }
      });
    }
  }
}
