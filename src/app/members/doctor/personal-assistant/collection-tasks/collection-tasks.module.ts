import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CollectionTasksPage } from './collection-tasks.page';
import { SharedModule } from '../../../../shared/shared.module';

const routes: Routes = [
  { path: '', component: CollectionTasksPage }
];

@NgModule({
  imports: [
    SharedModule,CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [CollectionTasksPage]
})
export class CollectionTasksPageModule {}
