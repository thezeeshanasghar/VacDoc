import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonDatetime } from '@ionic/angular';

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
  @Input() min: string;
  @Input() max: string;
  @Input()
  set value(val: string | null) {
    this._value = val ? val.slice(0, 10) : null;
  }
  get value(): string | null {
    return this._value;
  }
  @Output() valueChange = new EventEmitter<string | null>();
  @Output() dateChange = new EventEmitter<string | null>();

  @ViewChild('picker', { static: true }) picker: IonDatetime;

  private _value: string | null = null;
  disabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  get displayValue(): string {
    if (!this.value) {
      return '';
    }
    const [year, month, day] = this.value.split('-');
    return `${day}/${month}/${year}`;
  }

  async open(): Promise<void> {
    if (this.disabled) {
      return;
    }
    await this.picker.open();
    this.onTouched();
  }

  onDateChange(event: CustomEvent): void {
    const raw = event.detail.value as string;
    this.value = raw ? raw.slice(0, 10) : null;
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
}
