import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { StockManagementPage } from './stock-management.page';
import { MakePaymentComponent } from './make-payment.component';
import { DeleteBillComponent } from './delete-bill.component';

const routes: Routes = [
  {
    path: '',
    component: StockManagementPage
  },
  { path: 'add', loadChildren: () => import('./add/add.module').then(m => m.AddPageModule) },
  { path: 'brandlist/edit/:brandId', loadChildren: () => import('./editbrandlist/edit.module').then(m => m.EditPageModule) },
  { path: 'brandlist/:brandId', loadChildren: () => import('./brandlist/brandlist.module').then(m => m.BrandListPageModule) },
  { path: 'adjust', loadChildren: () => import('./adjust/adjust.module').then(m => m.AdjustPageModule) },
  { path: 'stockinhand', loadChildren: () => import('./stockinhand/stockinhand.module').then(m => m.StockInHandPageModule) },
  { path: 'stock-transfer', loadChildren: () => import('./stock-transfer/stock-transfer.module').then(m => m.StockTransferPageModule) },
  { path: 'stock-transfer-history', loadChildren: () => import('./stock-transfer-history/stock-transfer-history.module').then(m => m.StockTransferHistoryPageModule) },
  { path: 'stock-transfer-history/edit/:groupKey', loadChildren: () => import('./edit-transfer/edit-transfer.module').then(m => m.EditTransferPageModule) },
  { path: 'adjust-history', loadChildren: () => import('./adjust-history/adjust-history.module').then(m => m.AdjustHistoryPageModule) },
  { path: 'direct-sale', loadChildren: () => import('./direct-sale/direct-sale.module').then(m => m.DirectSalePageModule) },
  { path: 'direct-sale-history', loadChildren: () => import('./direct-sale-history/direct-sale-history.module').then(m => m.DirectSaleHistoryPageModule) },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [StockManagementPage, MakePaymentComponent, DeleteBillComponent],
  entryComponents: [MakePaymentComponent, DeleteBillComponent]
})
export class StockManagementPageModule {}  
