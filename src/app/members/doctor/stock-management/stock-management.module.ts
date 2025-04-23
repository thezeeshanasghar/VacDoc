import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { StockManagementPage } from './stock-management.page';

const routes: Routes = [
  {
    path: '',
    component: StockManagementPage
  },
  { path: 'add', loadChildren: () => import('./add/add.module').then(m => m.AddPageModule) },
  { path: 'brandlist/:brandId', loadChildren: () => import('./brandlist/brandlist.module').then(m => m.BrandListPageModule) },
  { path: 'adjust', loadChildren: () => import('./adjust/adjust.module').then(m => m.AdjustPageModule) },
  { path: 'stockinhand', loadChildren: () => import('./stockinhand/stockinhand.module').then(m => m.StockInHandPageModule) },
  { path: 'brandlist/edit/:brandId', loadChildren: () => import('./editbrandlist/edit.module').then(m => m.EditPageModule) },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  declarations: [StockManagementPage]  
})
export class StockManagementPageModule {}  
