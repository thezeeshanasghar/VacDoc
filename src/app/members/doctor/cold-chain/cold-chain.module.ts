import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ColdChainPage } from './cold-chain.page';

const routes: Routes = [
  {
    path: '',
    component: ColdChainPage
  },
  {
    path: 'pa-entry',
    loadChildren: () => import('./pa-entry/pa-entry.module').then(m => m.PaEntryPageModule)
  },
  {
    path: 'temperature-log',
    loadChildren: () => import('./temperature-log/temperature-log.module').then(m => m.TemperatureLogPageModule)
  },
  {
    path: 'doctor-approval',
    loadChildren: () => import('./doctor-approval/doctor-approval.module').then(m => m.DoctorApprovalPageModule)
  },
  {
    path: 'refrigerator-setup',
    loadChildren: () => import('./refrigerator-setup/refrigerator-setup.module').then(m => m.RefrigeratorSetupPageModule)
  },
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ColdChainPage]
})
export class ColdChainPageModule {}
