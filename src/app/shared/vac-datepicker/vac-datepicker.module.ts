import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material';
import { MatDialogModule } from '@angular/material/dialog';
import { VacDatePickerDialogComponent } from './vac-datepicker-dialog.component';

@NgModule({
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule],
  declarations: [VacDatePickerDialogComponent],
  entryComponents: [VacDatePickerDialogComponent],
  exports: [VacDatePickerDialogComponent],
})
export class VacDatePickerModule {}
