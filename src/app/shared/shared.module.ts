import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material';
import { Number2WeekPipe } from './number2-week.pipe';
import { DateInputComponent } from './date-input/date-input.component';

import { ScheduleVisitComponent } from './schedule-visit/schedule-visit.component';
import { InstantPipe, DayPipe } from './time';

@NgModule({
  declarations: [Number2WeekPipe, DateInputComponent, ScheduleVisitComponent, InstantPipe, DayPipe],
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    InstantPipe,
    DayPipe,
    Number2WeekPipe,
    DateInputComponent,
    ScheduleVisitComponent
  ]
})
export class SharedModule { }
