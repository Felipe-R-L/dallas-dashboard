import { Pipe, PipeTransform } from '@angular/core';
import { Dataset } from '../services/firebase.service';
import { SelectOption } from '../components/custom-select/custom-select';

@Pipe({
  name: 'datasetsToOptions',
  standalone: true,
})
export class DatasetsToOptionsPipe implements PipeTransform {
  transform(datasets: Dataset[] | null): SelectOption[] {
    if (!datasets) {
      return [];
    }
    return datasets.map((dataset) => ({
      value: dataset.id!,
      label: dataset.name,
    }));
  }
}
