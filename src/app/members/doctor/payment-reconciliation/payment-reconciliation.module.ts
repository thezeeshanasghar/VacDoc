import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentReconciliationRedirectPage } from './payment-reconciliation-redirect.page';

// The Payments page now lives in the "Cash" tab of PA Assignment Tracking. This route stays only
// so existing links and bookmarks land on that tab.
const routes: Routes = [{ path: '', component: PaymentReconciliationRedirectPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [PaymentReconciliationRedirectPage]
})
export class PaymentReconciliationPageModule {}
