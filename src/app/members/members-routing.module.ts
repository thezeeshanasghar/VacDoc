import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MembersPage } from './members.page';

const routes: Routes = [
  {
    path: '',
    component: MembersPage,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule) 
      },
      { 
        path: 'alert', 
        loadChildren: () => import('./alert/alert.module').then(m => m.AlertPageModule) 
      },
      { 
        path: 'doctor', 
        loadChildren: () => import('./doctor/doctor.module').then(m => m.DoctorPageModule) 
      },
      { 
        path: 'child', 
        loadChildren: () => import('./child/child.module').then(m => m.ChildPageModule) 
      },
      { 
        path: 'message', 
        loadChildren: () => import('./message/message.module').then(m => m.MessagePageModule) 
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MembersRoutingModule { }
