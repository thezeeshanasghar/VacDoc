import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadChildren: () => import('./public/login/login.module').then(m => m.LoginPageModule)
  },
  { 
    path: 'signup', 
    loadChildren: () => import('./public/signup/signup.module').then(m => m.SignupPageModule)
  },
  { 
    path: 'forget', 
    loadChildren: () => import('./public/forget/forget.module').then(m => m.ForgetPageModule)
  },
  {
    path: 'members',
    canActivate: [AuthGuard],
    loadChildren: () => import('./members/members.module').then(m => m.MembersPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
