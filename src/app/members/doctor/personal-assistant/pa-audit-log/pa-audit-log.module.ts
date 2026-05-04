import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PaAuditLogPage } from './pa-audit-log.page';

const routes: Routes = [{ path: '', component: PaAuditLogPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [PaAuditLogPage]
})
export class PaAuditLogPageModule {}
