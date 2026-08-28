import { Component, ElementRef, EventEmitter, HostListener, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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

  private _value: string | null = null;
  isOpen = false;
  disabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  get displayValue(): string {
    if (!this.value) {
      return '';
    }
    const [year, month, day] = this.value.split('-');
    return `${day}/${month}/${year}`;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.onTouched();
    }
  }

  onDateChange(event: CustomEvent): void {
    const raw = event.detail.value as string;
    this.value = raw ? raw.slice(0, 10) : null;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.dateChange.emit(this.value);
    this.isOpen = false;
    this.onTouched();
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
