import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ForgetPageRoutingModule } from './forget-routing.module';

import { ForgetPage } from './forget.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ForgetPageRoutingModule
  ],
  declarations: [ForgetPage]
})
export class ForgetPageModule {}
