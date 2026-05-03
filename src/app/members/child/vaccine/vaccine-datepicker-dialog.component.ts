import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCalendar } from '@angular/material/datepicker';

@Component({
  selector: 'app-vac-date-picker',
  template: `
    <div class="vac-dp-year-bar">{{ viewDate.getFullYear() }}</div>
    <div class="vac-dp-nav">
      <button class="vac-dp-arrow" (click)="prev()" type="button">&#8249;</button>
      <span class="vac-dp-month-name">{{ monthName }}</span>
      <button class="vac-dp-arrow" (click)="next()" type="button">&#8250;</button>
    </div>
    <mat-calendar
      [selected]="selectedDate"
      [startAt]="viewDate"
      (selectedChange)="onSelect($event)">
    </mat-calendar>
    <div class="vac-dp-actions">
      <button class="vac-dp-cancel" (click)="cancel()" type="button">CANCEL</button>
      <button class="vac-dp-ok" (click)="ok()" type="button">OK</button>
    </div>
  `
})
export class VacDatePickerDialogComponent implements AfterViewInit {
  @ViewChild(MatCalendar, { static: false }) calRef!: MatCalendar<Date>;

  selectedDate: Date;
  viewDate: Date;

  private readonly MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  get monthName(): string {
    return this.MONTHS[this.viewDate.getMonth()];
  }

  constructor(
    private dialogRef: MatDialogRef<VacDatePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { date: string }
  ) {
    this.selectedDate = data && data.date ? new Date(data.date) : new Date();
    this.viewDate = new Date(this.selectedDate);
  }

  ngAfterViewInit() {}

  onSelect(date: Date) {
    if (date) {
      this.selectedDate = date;
    }
  }

  prev() {
    const d = new Date(this.viewDate);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    this.viewDate = new Date(d);
    if (this.calRef) { this.calRef.activeDate = new Date(d); }
  }

  next() {
    const d = new Date(this.viewDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    this.viewDate = new Date(d);
    if (this.calRef) { this.calRef.activeDate = new Date(d); }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  ok() {
    this.dialogRef.close(this.selectedDate);
  }
}
