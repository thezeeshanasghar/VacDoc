import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ManagerPermissionsPage } from './manager-permissions.page';

const routes: Routes = [{ path: '', component: ManagerPermissionsPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ManagerPermissionsPage]
})
export class ManagerPermissionsPageModule {}
