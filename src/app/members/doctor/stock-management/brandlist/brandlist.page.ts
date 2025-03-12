import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { StockManagementService } from '../stock-management.service';

interface BrandBill {
  BillNo: string;
  Date: string;
  SupName: string;
  Quantity: number;
  PurchasedAmt: number;
  IsPaid: boolean;
}

@Component({
  selector: 'app-brandlist',
  templateUrl: './brandlist.page.html',
  styleUrls: ['./brandlist.page.scss'],
})
export class BrandListPage implements OnInit {
  brandName: string;
  brandBills: BrandBill[] = [];

  constructor(
    private route: ActivatedRoute,
    // private stockService: StockManagementService
  ) {
    this.brandName = this.route.snapshot.paramMap.get('brandName');
  }

  ngOnInit() {
    // this.loadBrandBills();
  }

  // loadBrandBills() {
  //   this.stockService.getBrandBills(this.brandName).subscribe({
  //     next: (response) => {
  //       if (response.IsSuccess) {
  //         this.brandBills = response.ResponseData;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading brand bills:', error);
  //     }
  //   });
  // }
}