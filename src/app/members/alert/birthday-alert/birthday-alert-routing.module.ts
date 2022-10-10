import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BirthdayAlertPage } from './birthday-alert.page';

const routes: Routes = [
  {
    path: '',
    component: BirthdayAlertPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BirthdayAlertPageRoutingModule {}
