import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { FinancialPage } from './financial.page';

const routes: Routes = [
  {
    path: '',
    component: FinancialPage
  },
  {
    path: 'expense-list',
    loadChildren: () => import('./expense-list/expense-list.module').then(m => m.ExpenseListPageModule)
  },
  {
    path: 'add-expense',
    loadChildren: () => import('./add-expense/add-expense.module').then(m => m.AddExpensePageModule)
  },
  {
    path: 'fixed-assets',
    loadChildren: () => import('./fixed-assets/fixed-assets.module').then(m => m.FixedAssetsPageModule)
  },
  {
    path: 'pnl',
    loadChildren: () => import('./pnl/pnl.module').then(m => m.PnlPageModule)
  },
  {
    path: 'reporting',
    loadChildren: () => import('./reporting/reporting.module').then(m => m.ReportingPageModule)
  },
  {
    path: 'cash-handover',
    loadChildren: () => import('../personal-assistant/cash-handover/cash-handover.module').then(m => m.CashHandoverPageModule)
  },
  {
    path: 'sales-collection',
    loadChildren: () => import('./sales-collection/sales-collection.module').then(m => m.SalesCollectionPageModule)
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [FinancialPage]
})
export class FinancialPageModule {}
