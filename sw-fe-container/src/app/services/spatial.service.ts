import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpatialService {
  private apiUrl = `${environment.apiUrl}/v0/spatial`; // Note: Backend needs endpoint for GeoJSON

  constructor(private http: HttpClient) { }

  getWaterwayBuffers(distance: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/waterway-buffers?distance=${distance}`);
  }
}
