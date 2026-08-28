import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Number2WeekPipe } from './number2-week.pipe';
import { DateInputComponent } from './date-input/date-input.component';

@NgModule({
  declarations: [Number2WeekPipe, DateInputComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [
    Number2WeekPipe,
    DateInputComponent
  ]
})
export class SharedModule { }
