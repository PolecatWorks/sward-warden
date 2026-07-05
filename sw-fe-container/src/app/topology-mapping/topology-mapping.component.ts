import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { SpatialService } from '../services/spatial.service';

@Component({
  selector: 'app-topology-mapping',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './topology-mapping.component.html',
  styleUrl: './topology-mapping.component.css',
})
export class TopologyMappingComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  farmId: string | null = null;
  fields = [
    { name: 'North Field', slope: 'Gentle (2%)', riskLevel: 'Low' },
    { name: 'South Field', slope: 'Moderate (8%)', riskLevel: 'Medium' },
    { name: 'River Bend Field', slope: 'Steep (15%)', riskLevel: 'High' },
  ];

  constructor(
    private spatialService: SpatialService,
    private route: ActivatedRoute,
  ) {}

  // PRD Reference: 0008
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.farmId = params.get('farmId');
    });
  }

  // PRD Reference: 0008
  ngAfterViewInit() {
    this.initMap();
    this.loadWaterwayBuffers();
  }

  // PRD Reference: 0008
  private initMap(): void {
    // TODO: In the future, when PRDs add farm locations, fetch the farm by `this.farmId`
    // and use its specific coordinates to center the map instead of the hardcoded default.
    this.map = L.map('map', {
      center: [54.5, -6.5], // Northern Ireland center approx
      zoom: 13,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );

    tiles.addTo(this.map);
  }

  // PRD Reference: 0008
  private loadWaterwayBuffers(): void {
    // Fetch 10m buffers for organic manure
    this.spatialService.getWaterwayBuffers(10).subscribe((data) => {
      L.geoJSON(data, {
        style: {
          color: '#f43f5e',
          weight: 2,
          opacity: 0.8,
          fillColor: '#f43f5e',
          fillOpacity: 0.3,
        },
      }).addTo(this.map);
    });
  }
}
