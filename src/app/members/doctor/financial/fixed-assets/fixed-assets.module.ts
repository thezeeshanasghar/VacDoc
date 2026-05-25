import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { FixedAssetsPage } from './fixed-assets.page';

const routes: Routes = [
  { path: '', component: FixedAssetsPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [FixedAssetsPage]
})
export class FixedAssetsPageModule {}
