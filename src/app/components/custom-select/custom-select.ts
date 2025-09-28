import { Component, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: SelectOption[] = [];

  selectedOption: SelectOption | null = null;
  isOpen = false;
  isDisabled = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  writeValue(value: any): void {
    const option = this.options.find((opt) => opt.value === value);
    this.selectedOption = option || null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  toggleDropdown(): void {
    if (!this.isDisabled) {
      this.isOpen = !this.isOpen;
      this.onTouched();
    }
  }

  selectOption(option: SelectOption): void {
    this.selectedOption = option;
    this.onChange(option.value);
    this.isOpen = false;
  }
}
