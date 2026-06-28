import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
// @ts-ignore
import * as WktModule from 'wicket';

@Component({
  selector: 'app-field-map-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="map-container relative w-full h-[400px] border border-outline rounded-md overflow-hidden"
    >
      <div #mapElement class="w-full h-full"></div>
      <div
        class="absolute top-2 right-2 z-[1000] bg-surface rounded shadow p-2 flex flex-col gap-2"
        *ngIf="isEditMode"
      >
        <button
          type="button"
          class="px-2 py-1 bg-primary text-on-primary text-xs rounded hover:bg-primary/90"
          (click)="autoDetectStub()"
        >
          Auto-Detect (Stub)
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Ensure Leaflet controls stay above other map elements but below modals */
      ::ng-deep .leaflet-control-container .leaflet-top,
      ::ng-deep .leaflet-control-container .leaflet-bottom {
        z-index: 999;
      }
    `,
  ],
})
export class FieldMapEditorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('mapElement') mapElement!: ElementRef;

  @Input() wkt: string = '';
  @Input() isEditMode: boolean = true;
  @Input() readonly: boolean = false;
  @Output() wktChange = new EventEmitter<string>();

  private map!: L.Map;
  private currentLayer: L.Layer | null = null;
  private wicket: any;

  constructor() {
    this.wicket = new (WktModule as any).Wkt();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
    if (this.wkt) {
      this.loadWkt(this.wkt);
    }

    if (this.isEditMode && !this.readonly) {
      this.setupGeoman();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [54.5, -6.5], // Default center
      zoom: 13,
    });

    const tiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    );

    tiles.addTo(this.map);
  }

  private setupGeoman(): void {
    this.map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      rotateMode: false,
    });

    // Only allow drawing one polygon at a time
    this.map.on('pm:create', (e) => {
      if (this.currentLayer) {
        this.map.removeLayer(this.currentLayer);
      }
      this.currentLayer = e.layer;
      this.updateWktFromLayer(this.currentLayer);

      // Listen for updates on the new layer
      this.currentLayer.on('pm:update', () =>
        this.updateWktFromLayer(this.currentLayer!),
      );
    });

    this.map.on('pm:remove', (e) => {
      if (this.currentLayer === e.layer) {
        this.currentLayer = null;
        this.wktChange.emit('');
      }
    });
  }

  private loadWkt(wktString: string): void {
    try {
      this.wicket.read(wktString);
      const geojson = this.wicket.toJson();

      const layer = L.geoJSON(geojson, {
        style: {
          color: '#1976d2',
          weight: 2,
          opacity: 0.8,
          fillColor: '#1976d2',
          fillOpacity: 0.3,
        },
      });

      if (this.currentLayer) {
        this.map.removeLayer(this.currentLayer);
      }

      layer.addTo(this.map);
      this.map.fitBounds(layer.getBounds());

      // In Geoman, we typically want to work with the individual polygon layer, not the GeoJSON group
      // if we want to edit it directly.
      const layers = layer.getLayers();
      if (layers.length > 0) {
        this.currentLayer = layers[0];
        if (this.isEditMode && !this.readonly) {
          this.currentLayer.on('pm:update', () =>
            this.updateWktFromLayer(this.currentLayer!),
          );
        }
      }
    } catch (e) {
      console.error('Invalid WKT string', e);
    }
  }

  private updateWktFromLayer(layer: L.Layer): void {
    try {
      let geojson;
      if (typeof (layer as any).toGeoJSON === 'function') {
        geojson = (layer as any).toGeoJSON();
      }

      if (geojson && geojson.geometry) {
        this.wicket.fromObject(geojson.geometry);
        const wktString = this.wicket.write();
        this.wktChange.emit(wktString);
      }
    } catch (e) {
      console.error('Error generating WKT from layer', e);
    }
  }

  // Stub for PRD 24 auto-detection
  autoDetectStub(): void {
    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
    }

    const center = this.map.getCenter();
    const offset = 0.005; // rough square

    const latlngs = [
      [center.lat + offset, center.lng - offset],
      [center.lat + offset, center.lng + offset],
      [center.lat - offset, center.lng + offset],
      [center.lat - offset, center.lng - offset],
    ] as L.LatLngTuple[];

    const polygon = L.polygon(latlngs, {
      color: '#1976d2',
      weight: 2,
      opacity: 0.8,
      fillColor: '#1976d2',
      fillOpacity: 0.3,
    });

    polygon.addTo(this.map);
    this.currentLayer = polygon;
    this.updateWktFromLayer(polygon);

    if (this.isEditMode && !this.readonly) {
      this.currentLayer.on('pm:update', () =>
        this.updateWktFromLayer(this.currentLayer!),
      );
    }
    this.map.fitBounds(polygon.getBounds());
  }
}
