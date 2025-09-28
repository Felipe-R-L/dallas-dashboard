import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { InputComponent } from '../input/input';

@Component({
  selector: 'app-create-dataset-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule, InputComponent],
  templateUrl: `./create-dataset-modal.html`,
})
export class CreateDatasetModalComponent {
  @Output() create = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  datasetName = '';

  onCreate(): void {
    if (this.datasetName.trim()) {
      this.create.emit(this.datasetName.trim());
    }
  }
}
