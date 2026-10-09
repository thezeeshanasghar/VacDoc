import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AssistantLocationsPage } from './assistant-locations.page';

const routes: Routes = [
  { path: '', component: AssistantLocationsPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AssistantLocationsPage]
})
export class AssistantLocationsPageModule {}
