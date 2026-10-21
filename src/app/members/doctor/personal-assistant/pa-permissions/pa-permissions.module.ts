import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaPermissionsPage } from './pa-permissions.page';
import { PendingPermissionsGuard } from './pending-changes.guard';

const routes: Routes = [{ path: '', component: PaPermissionsPage, canDeactivate: [PendingPermissionsGuard] }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaPermissionsPage]
})
export class PaPermissionsPageModule {}
