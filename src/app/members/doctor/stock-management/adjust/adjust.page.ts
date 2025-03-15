import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/shared/toast.service';
import { BrandService } from 'src/app/services/brand.service';
import { StockService, AdjustStockDTO } from 'src/app/services/stock.service';
import { LoadingController } from '@ionic/angular';

interface StockAdjustment {
  brandId: number;
  type: 'increase' | 'decrease';
  date: string;
  quantity: number;
  price: number;
  reason: string;
}

@Component({
  selector: 'app-adjust',
  templateUrl: './adjust.page.html',
  styleUrls: ['./adjust.page.scss']
})
export class AdjustPage implements OnInit {
    isIncrease: boolean = false;
    isDecrease: boolean = false;
  adjustment: StockAdjustment = {
    brandId: null,
    type: null,
    date: new Date().toISOString(),
    quantity: null,
    price: null,
    reason: ''
  };

  brands = [];

  constructor(
    private brandService: BrandService,
    private stockService: StockService,
    private toastService: ToastService,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadBrands();
  }

  async loadBrands() {
    try {
      this.brandService.getBrands().subscribe({
        next: (response) => {
          if (response.IsSuccess) {
            this.brands = response.ResponseData.map(brand => ({
              id: brand.Id,
              name: brand.Name
            }));
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          console.error('Error fetching brands:', error);
          this.toastService.create('Failed to load brands', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in loadBrands:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }
  onIncreaseChange() {
    if (this.isIncrease) {
        this.isDecrease = false;
        this.adjustment.type = 'increase';
    }
}

onDecreaseChange() {
    if (this.isDecrease) {
        this.isIncrease = false;
        this.adjustment.type = 'decrease';
    }
}
async onSubmit() {
    if (!this.isValid()) {
      return;
    }

    try {
      const loading = await this.loadingController.create({
        message: 'Adjusting stock...'
      });
      await loading.present();

      const dto: AdjustStockDTO = {
        brandId: this.adjustment.brandId,
        adjustment: this.isIncrease ? this.adjustment.quantity : -this.adjustment.quantity,
        reason: this.adjustment.reason,
        date: new Date(this.adjustment.date)
      };

      this.stockService.adjustStock(dto).subscribe({
        next: (response) => {
          loading.dismiss();
          if (response.IsSuccess) {
            this.toastService.create(response.Message, 'success');
            this.resetForm();
          } else {
            this.toastService.create(response.Message, 'danger');
          }
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error adjusting stock:', error);
          this.toastService.create('Failed to adjust stock', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in onSubmit:', error);
      this.toastService.create('An unexpected error occurred', 'danger');
    }
  }

  private isValid(): boolean {
    if (!this.adjustment.brandId) {
      this.toastService.create('Please select a brand', 'warning');
      return false;
    }
    if (!this.adjustment.quantity || this.adjustment.quantity <= 0) {
      this.toastService.create('Please enter a valid quantity', 'warning');
      return false;
    }
    if (!this.adjustment.reason) {
      this.toastService.create('Please enter a reason for adjustment', 'warning');
      return false;
    }
    if (!this.isIncrease && !this.isDecrease) {
      this.toastService.create('Please select adjustment type', 'warning');
      return false;
    }
    return true;
  }

  private resetForm() {
    this.adjustment = {
      brandId: null,
      type: null,
      date: new Date().toISOString(),
      quantity: null,
      price: null,
      reason: ''
    };
    this.isIncrease = false;
    this.isDecrease = false;
  }
}