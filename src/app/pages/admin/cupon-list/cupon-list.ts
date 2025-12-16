import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CuponService } from '../../../services/cupon';
import { Cupon } from '../../../model/cupon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cupon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cupon-list.html'
})
export class CuponListComponent implements OnInit {

  private cuponService = inject(CuponService);
  cupones: Cupon[] = [];

  ngOnInit() {
    this.cargarCupones();
  }

  cargarCupones() {
    this.cuponService.obtenerTodos().subscribe({
      next: (data) => this.cupones = data,
      error: (err) => console.error('Error al cargar cupones', err)
    });
  }

  eliminarCupon(cupon: Cupon) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el cupón "${cupon.codigo}". No se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && cupon.idCupom) {
        this.cuponService.eliminar(cupon.idCupom).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El cupón ha sido eliminado.', 'success');
            this.cargarCupones(); // Recargar la tabla
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el cupón.', 'error')
        });
      }
    });
  }
}
