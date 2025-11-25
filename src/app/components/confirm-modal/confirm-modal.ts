import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../services/modal'; // Importa el servicio que acabamos de crear
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css'
})
export class ConfirmModalComponent {

  public modalState$: Observable<{ show: boolean, message: string }>;

  constructor(private modalService: Modal) {
    this.modalState$ = this.modalService.watch();
  }

  confirm(): void {
    this.modalService.confirm();
  }

  cancel(): void {
    this.modalService.cancel();
  }
}
