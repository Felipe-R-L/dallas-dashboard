import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../select/select';
import { InputComponent } from '../input/input';

@Component({
  selector: 'app-dashboard-filter',
  standalone: true,
  imports: [SelectComponent, InputComponent, FormsModule],
  templateUrl: './dashboard-filter.html',
})
export class DashboardFilterComponent {
  @Input() datasets: SelectOption[] = [];
  @Output() filterChange = new EventEmitter<any>();
  @Output() newCompany = new EventEmitter<void>();
  @Output() importFile = new EventEmitter<void>();

  selectedDatasetId: string | number = '';
  startDate = '2024-12-01';
  endDate = '2024-12-31';

  applyFilters() {
    this.filterChange.emit({
      datasetId: this.selectedDatasetId,
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }
}
