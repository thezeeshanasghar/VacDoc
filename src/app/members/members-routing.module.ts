import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MembersPage } from './members.page';

const routes: Routes = [
  {
    path: '',
    component: MembersPage,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardPageModule' },
      { path: 'alert', loadChildren: './alert/alert.module#AlertPageModule' },
      { path: 'doctor', loadChildren: './doctor/doctor.module#DoctorPageModule' },
      { path: 'child', loadChildren: './child/child.module#ChildPageModule' },
      { path: 'message', loadChildren: './message/message.module#MessagePageModule' }
    ]
  },  {
    path: 'birthday-alert',
    loadChildren: () => import('./alert/birthday-alert/birthday-alert.module').then( m => m.BirthdayAlertPageModule)
  },

  

];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MembersRoutingModule { }
