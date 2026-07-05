import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PaService } from 'src/app/services/pa.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.page.html',
  styleUrls: ['./stock-management.page.scss'],
})
export class StockManagementPage {
  showSuppliers    = true;
  showPurchaseBills= true;
  showOverview     = true;
  showAdjust       = true;
  showTransfer     = true;
  showDirectSale   = true;
  showReports      = true;
  showOpeningBalance = true;   // doctor-only reset op; hidden for PAs

  constructor(
    private storage: Storage,
    private paService: PaService,
  ) {}

  async ionViewWillEnter() {
    const user = await this.storage.get(environment.USER);
    if (user && user.UserType === 'PA') {
      this.showOpeningBalance = false;   // doctor-only
      try {
        const perm: any = await this.paService.getPaPermissions(Number(user.PAId)).toPromise();
        this.showSuppliers     = !!(perm && perm.StockSuppliers);
        this.showPurchaseBills = !!(perm && perm.StockPurchaseBills);
        this.showOverview      = !!(perm && perm.StockOverview);
        this.showAdjust        = !!(perm && perm.StockAdjust);
        this.showTransfer      = !!(perm && perm.StockTransfer);
        this.showDirectSale    = !!(perm && perm.StockDirectSale);
        this.showReports       = !!(perm && perm.StockReports);
      } catch {
        this.showSuppliers = this.showPurchaseBills = this.showOverview =
          this.showAdjust = this.showTransfer = this.showDirectSale = this.showReports = false;
      }
    }
    // If doctor: all flags stay true (default)
  }
}
