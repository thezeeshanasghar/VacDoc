import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { StockManagementPage } from './stock-management.page';

const routes: Routes = [
  {
    path: '',
    component: StockManagementPage
  },
  {
    path: 'suppliers',
    loadChildren: () => import('../financial/supplier-list/supplier-list.module').then(m => m.SupplierListPageModule)
  },
  {
    path: 'supplier-edit/:id',
    loadChildren: () => import('../financial/supplier-edit/supplier-edit.module').then(m => m.SupplierEditPageModule)
  },
  {
    path: 'supplier-ledger/:id',
    loadChildren: () => import('../financial/supplier-ledger/supplier-ledger.module').then(m => m.SupplierLedgerPageModule)
  },
  {
    path: 'purchase-bills',
    loadChildren: () => import('./purchase-bills/purchase-bills.module').then(m => m.PurchaseBillsPageModule)
  },
  {
    path: 'purchase-bills/add',
    loadChildren: () => import('./purchase-bills/add-bill/add-bill.module').then(m => m.AddBillPageModule)
  },
  {
    path: 'purchase-bills/edit/:id',
    loadChildren: () => import('./purchase-bills/edit-bill/edit-bill.module').then(m => m.EditBillPageModule)
  },
  {
    path: 'stock-overview',
    loadChildren: () => import('./stock-overview/stock-overview.module').then(m => m.StockOverviewPageModule)
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [StockManagementPage]
})
export class StockManagementPageModule {}
