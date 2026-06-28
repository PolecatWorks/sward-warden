import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-import-export-contracts',
  imports: [RouterLink],
  templateUrl: './import-export-contracts.component.html',
  styleUrl: './import-export-contracts.component.css',
})
export class ImportExportContractsComponent {}
