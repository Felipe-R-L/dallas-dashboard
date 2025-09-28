import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select';
import { InputComponent } from '../input/input';

@Component({
  selector: 'app-dashboard-filter',
  standalone: true,
  imports: [CustomSelectComponent, InputComponent, FormsModule],
  templateUrl: './dashboard-filter.html',
})
export class DashboardFilterComponent implements OnInit, OnChanges {
  @Input() datasets: SelectOption[] = [];
  @Input() initialDatasetId: string | null = null;

  @Output() filterChange = new EventEmitter<{
    datasetId: string | number;
    startDate: string;
    endDate: string;
  }>();

  @Output() newCompany = new EventEmitter<void>();
  @Output() importFile = new EventEmitter<void>();

  selectedDatasetId: string | number = '';

  startDate: string = '';
  endDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const toInputDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.startDate = toInputDateString(firstDayOfMonth);
    this.endDate = toInputDateString(today);

    this.initializeDatasetId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialDatasetId'] && changes['initialDatasetId'].currentValue) {
      this.selectedDatasetId = changes['initialDatasetId'].currentValue;
    }
  }

  private initializeDatasetId(): void {
    if (this.initialDatasetId) {
      this.selectedDatasetId = this.initialDatasetId;
    } else if (this.datasets.length > 0) {
      this.selectedDatasetId = this.datasets[0].value;
    }
  }

  applyFilters(): void {
    this.filterChange.emit({
      datasetId: this.selectedDatasetId,
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }
}
