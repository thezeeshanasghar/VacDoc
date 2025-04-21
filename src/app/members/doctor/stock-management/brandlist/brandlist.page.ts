import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StockService,BillDetails, Response } from 'src/app/services/stock.service';

interface BrandBill {
  BillId: number;
  BillNo: string;
  Date: string;
  SupName: string;
  Quantity: number;
  PurchasedAmt: number;
  IsPaid: boolean;
  BrandId: number;
  BrandName: string;
  VaccineName: string;
  Supplier: string;
  StockAmount: number;
  Id: number;
  Paiddate: string;
}

@Component({
  selector: 'app-brandlist',
  templateUrl: './brandlist.page.html',
  styleUrls: ['./brandlist.page.scss'],
})
export class BrandListPage implements OnInit {
  brandName: string;
  brandBills: BrandBill[] = [];
  brandId: number;
  data: BillDetails[];
  Bills: BillDetails[];
  constructor(
    private route: ActivatedRoute,
    private stockService: StockService
  ) {
    // Get brandId from URL parameter
    this.route.params.subscribe(params => {
      this.brandId = +params['brandId']; // Convert string to number using +
      if (this.brandId) {
        this.loadBrandBills();
      }
    });
  }

  ngOnInit() {
    this.loadBrandBills()
  }

  loadBrandBills() {
    this.stockService.getBrandBills(this.brandId).subscribe({
      next: (response) => {
        if (response.IsSuccess) {
          // this.brandBills = response.ResponseData.map((item: any) => ({
          //   BillId: item.billId,
          //   BillNo: item.billNo,
          //   Date: item.date,
          //   SupName: item.supName,
          //   Quantity: item.quantity,
          //   PurchasedAmt: item.purchasedAmt,
          //   IsPaid: item.isPaid,
          //   BrandId: item.brandId,
          //   BrandName: item.brandName,
          //   VaccineName: item.vaccineName,
          //   Supplier: item.supplier,
          //   StockAmount: item.stockAmount,
          //   Id: item.id
          // }));
           this.data=response.ResponseData;
           this.Bills = this.data;
           console.log('Data:', this.data);
          // console.log('Brand bills loaded:', this.brandBills);
          console.log('Brand bills loaded:', response.ResponseData);
        }
      },
      error: (error) => {
        console.error('Error loading brand bills:', error);
      }
    });
  }
  totalAmount(): string {
    if (!this.data || !this.data.length) {
      return '0.00';
    }
  
    const total = this.data.reduce((acc, item) => {
      const amount = item.Quantity * item.StockAmount || 0;
      return acc + amount;
    }, 0);
  
    return total.toFixed(2);
  }
}