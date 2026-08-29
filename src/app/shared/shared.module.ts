import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material';
import { Number2WeekPipe } from './number2-week.pipe';
import { DateInputComponent } from './date-input/date-input.component';

@NgModule({
  declarations: [Number2WeekPipe, DateInputComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    Number2WeekPipe,
    DateInputComponent
  ]
})
export class SharedModule { }
