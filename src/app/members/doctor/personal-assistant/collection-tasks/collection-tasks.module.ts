import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CollectionTasksPage } from './collection-tasks.page';

const routes: Routes = [
  { path: '', component: CollectionTasksPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [CollectionTasksPage]
})
export class CollectionTasksPageModule {}
