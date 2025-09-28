import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../input/input'; // Importe o novo InputComponent

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [FormsModule, InputComponent],
  templateUrl: './date-range-picker.html',
})
export class DateRangePickerComponent {
  @Output() dateRangeChange = new EventEmitter<{ startDate: string; endDate: string }>();

  startDate = '2024-12-01';
  endDate = '2024-12-31';

  applyFilter(): void {
    if (this.startDate && this.endDate) {
      this.dateRangeChange.emit({
        startDate: this.startDate,
        endDate: this.endDate,
      });
    }
  }
}
