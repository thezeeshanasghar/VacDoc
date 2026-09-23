import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AgentModulePage } from './agent-module.page';
import { AgentEditModalComponent } from './agent-edit-modal/agent-edit-modal.component';

const routes: Routes = [
  { path: '', component: AgentModulePage },
  {
    path: 'report/:id',
    loadChildren: () => import('./agent-report/agent-report.module').then(m => m.AgentReportPageModule)
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AgentModulePage, AgentEditModalComponent],
  entryComponents: [AgentEditModalComponent]
})
export class AgentModulePageModule {}
