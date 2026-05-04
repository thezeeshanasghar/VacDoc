import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { VacDatePickerDialogComponent } from './vac-datepicker-dialog.component';

@Injectable({ providedIn: 'root' })
export class VacDatePickerService {
  constructor(private dialog: MatDialog) {}

  open(currentDate?: any, options?: { min?: Date; max?: Date }): Observable<Date | null> {
    return this.dialog.open(VacDatePickerDialogComponent, {
      data: {
        date: currentDate,
        min: options && options.min ? options.min : null,
        max: options && options.max ? options.max : null,
      },
      panelClass: 'vac-datepicker-panel',
      width: '320px',
      autoFocus: false,
    }).afterClosed();
  }
}
