import { Component, Inject, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCalendar } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vac-date-picker',
  template: `
    <ng-container *ngIf="!isYearView">
      <div class="vac-dp-year-bar" (click)="openYearView()">
        {{ viewDate.getFullYear() }}<span class="vac-dp-year-caret">&#9650;</span>
      </div>
      <div class="vac-dp-nav">
        <button class="vac-dp-arrow" (click)="prev()" type="button">&#8249;</button>
        <span class="vac-dp-month-name">{{ monthName }}</span>
        <button class="vac-dp-arrow" (click)="next()" type="button">&#8250;</button>
      </div>
    </ng-container>

    <div class="vac-cal-wrapper" [class.year-view-active]="isYearView">
      <mat-calendar
        [selected]="selectedDate"
        [startAt]="viewDate"
        [minDate]="minDate"
        [maxDate]="maxDate"
        (selectedChange)="onSelect($event)">
      </mat-calendar>
    </div>

    <div class="vac-dp-actions">
      <button class="vac-dp-cancel" (click)="cancel()" type="button">CANCEL</button>
      <button class="vac-dp-ok" (click)="ok()" type="button">OK</button>
    </div>
  `
})
export class VacDatePickerDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatCalendar, { static: false }) calRef!: MatCalendar<Date>;

  selectedDate: Date;
  viewDate: Date;
  minDate: Date;
  maxDate: Date;
  isYearView = false;

  private readonly MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  private viewSub!: Subscription;

  get monthName(): string {
    return this.MONTHS[this.viewDate.getMonth()];
  }

  constructor(
    private dialogRef: MatDialogRef<VacDatePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { date?: any; min?: Date; max?: Date },
    private cdr: ChangeDetectorRef
  ) {
    this.selectedDate = data && data.date ? new Date(data.date) : new Date();
    this.viewDate = new Date(this.selectedDate);
    this.minDate = data && data.min ? new Date(data.min) : null;
    this.maxDate = data && data.max ? new Date(data.max) : null;
  }

  ngAfterViewInit() {
    this.viewSub = this.calRef.stateChanges.subscribe(() => {
      if (this.calRef.currentView === 'month' && this.isYearView) {
        this.isYearView = false;
        this.viewDate = new Date(this.calRef.activeDate as any);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.viewSub) { this.viewSub.unsubscribe(); }
  }

  onSelect(date: Date) {
    if (date) { this.selectedDate = date; }
  }

  openYearView() {
    if (this.calRef) {
      (this.calRef as any).currentView = 'multi-year';
      this.isYearView = true;
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

  cancel() { this.dialogRef.close(null); }
  ok() { this.dialogRef.close(this.selectedDate); }
}
