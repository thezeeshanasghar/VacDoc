import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Number2WeekPipe } from './number2-week.pipe';

@NgModule({
  declarations: [Number2WeekPipe],
  imports: [
    CommonModule
  ],
  exports: [
    Number2WeekPipe
  ]
})
export class SharedModule { }
