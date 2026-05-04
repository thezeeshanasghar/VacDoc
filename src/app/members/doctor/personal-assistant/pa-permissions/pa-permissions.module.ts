import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaPermissionsPage } from './pa-permissions.page';

const routes: Routes = [{ path: '', component: PaPermissionsPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaPermissionsPage]
})
export class PaPermissionsPageModule {}
