import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule'
  },
  { path: 'message', loadChildren: './message/message.module#MessagePageModule' },
  { path: 'clinic', loadChildren: './clinic/clinic.module#ClinicPageModule' },
  { path: 'alert', loadChildren: './alert/alert.module#AlertPageModule' },
  { path: 'child', loadChildren: './child/child.module#ChildPageModule' },
  { path: 'child/:id/vaccine', loadChildren: './child/vaccine/vaccine.module#VaccinePageModule' },
  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
  { path: 'child/:id/edit', loadChildren: './child/edit/edit.module#EditPageModule' }


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
