import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-waterway-protection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  templateUrl: './waterway-protection.component.html',
  styleUrl: './waterway-protection.component.css',
})
export class WaterwayProtectionComponent {
  waterways = [
    { name: 'River Shannon', bufferZone: '10m', isWithinBuffer: false },
    { name: 'Local Stream (East)', bufferZone: '5m', isWithinBuffer: true },
  ];
}
