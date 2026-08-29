import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    }
  ]
})
export class DateInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'DD/MM/YYYY';
  @Input()
  set min(val: string) {
    this.minDate = val ? this.toDate(val) : null;
  }
  @Input()
  set max(val: string) {
    this.maxDate = val ? this.toDate(val) : null;
  }
  @Input()
  set value(val: string | null) {
    this._value = val ? val.slice(0, 10) : null;
  }
  get value(): string | null {
    return this._value;
  }
  @Output() valueChange = new EventEmitter<string | null>();
  @Output() dateChange = new EventEmitter<string | null>();

  @ViewChild('picker', { static: true }) picker: MatDatepicker<Date>;

  minDate: Date | null = null;
  maxDate: Date | null = null;
  disabled = false;

  private _value: string | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  get displayValue(): string {
    if (!this.value) {
      return '';
    }
    const [year, month, day] = this.value.split('-');
    return `${day}/${month}/${year}`;
  }

  get dateValue(): Date | null {
    return this.value ? this.toDate(this.value) : null;
  }

  open(): void {
    if (this.disabled) {
      return;
    }
    this.picker.open();
    this.onTouched();
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.value = event.value ? this.toIso(event.value) : null;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.dateChange.emit(this.value);
  }

  writeValue(value: string | null): void {
    this._value = value ? value.slice(0, 10) : null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private toDate(iso: string): Date {
    const [year, month, day] = iso.split('-').map(n => parseInt(n, 10));
    return new Date(year, month - 1, day);
  }

  private toIso(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
