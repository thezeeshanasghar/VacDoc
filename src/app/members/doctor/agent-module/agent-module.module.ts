import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AgentModulePage } from './agent-module.page';

const routes: Routes = [
  { path: '', component: AgentModulePage },
  {
    path: 'report/:id',
    loadChildren: () => import('./agent-report/agent-report.module').then(m => m.AgentReportPageModule)
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AgentModulePage]
})
export class AgentModulePageModule {}
