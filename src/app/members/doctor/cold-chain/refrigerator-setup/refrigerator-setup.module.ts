import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { RefrigeratorSetupPage } from './refrigerator-setup.page';

const routes: Routes = [
  { path: '', component: RefrigeratorSetupPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [RefrigeratorSetupPage]
})
export class RefrigeratorSetupPageModule {}
