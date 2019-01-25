import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
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
  { path: 'vaccine', loadChildren: './child/vaccine/vaccine.module#VaccinePageModule' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
