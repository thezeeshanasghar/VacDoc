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
    path: 'add-expense',
    loadChildren: () => import('./add-expense/add-expense.module').then(m => m.AddExpensePageModule)
  },
  {
    path: 'reporting',
    loadChildren: () => import('./reporting/reporting.module').then(m => m.ReportingPageModule)
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [FinancialPage]
})
export class FinancialPageModule {}
