import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AssistantKmPage } from './assistant-km.page';

const routes: Routes = [
  { path: '', component: AssistantKmPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AssistantKmPage]
})
export class AssistantKmPageModule {}
