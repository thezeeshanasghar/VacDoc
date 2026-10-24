import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { CustomQuickSettingPage } from './custom-quick-setting.page';

const routes: Routes = [
  {
    path: '',
    component: CustomQuickSettingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CustomQuickSettingPage]
})
export class CustomQuickSettingPageModule {}
