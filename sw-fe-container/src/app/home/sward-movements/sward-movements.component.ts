import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { SwardMovement } from '../../models/sward-movement';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-sward-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sward-movements.component.html',
  styleUrls: ['./sward-movements.component.css']
})
export class SwardMovementsComponent implements OnInit {
  farmId: number = 0;
  movements$: Observable<SwardMovement[]> = of([]);
  newMovement: SwardMovement = {
    farm_id: 0,
    movement_type: 'export',
    quantity_m3: 0,
    date: new Date().toISOString().split('T')[0],
    manure_type: 'Slurry',
    consignee_name: '',
    consignee_address: '',
    consignor_name: '',
    consignor_address: '',
    transporter_name: '',
    contract_length_months: 0
  };

  manureTypes = ['Slurry', 'Farmyard Manure', 'Poultry Manure', 'Mushroom Compost'];

  constructor(
    private route: ActivatedRoute,
    private farmManagementService: FarmManagementService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.farmId = +params['id'];
      this.newMovement.farm_id = this.farmId;
      this.loadMovements();
    });
  }

  loadMovements(): void {
    this.movements$ = this.farmManagementService.getSwardMovementsForFarm(this.farmId);
  }

  onSubmit(): void {
    this.farmManagementService.addSwardMovement(this.newMovement).subscribe(() => {
      this.loadMovements();
      this.resetForm();
    });
  }

  private resetForm(): void {
    this.newMovement = {
      farm_id: this.farmId,
      movement_type: 'export',
      quantity_m3: 0,
      date: new Date().toISOString().split('T')[0],
      manure_type: 'Slurry',
      consignee_name: '',
      consignee_address: '',
      consignor_name: '',
      consignor_address: '',
      transporter_name: '',
      contract_length_months: 0
    };
  }
}
