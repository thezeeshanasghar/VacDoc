import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPAPage } from './loginpa.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPAPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPAPageRoutingModule {}
