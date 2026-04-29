import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ImmunizationCardPage } from './immunization-card.page';

const routes: Routes = [{ path: '', component: ImmunizationCardPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ImmunizationCardPage]
})
export class ImmunizationCardPageModule {}
