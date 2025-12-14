import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Caja } from '../../../services/caja'; // Importa tu nuevo servicio
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-caja.component.html',
  styleUrls: ['./admin-caja.component.css']
})
export class AdminCajaComponent implements OnInit {

  public estadoCaja: 'ABIERTA' | 'CERRADA' | null = null;
  public datosCaja: any = null;
  public cargando: boolean = true;

  // Inputs del formulario
  public montoInput: number | null = null;

  constructor(private cajaService: Caja) {}

  ngOnInit(): void {
    this.verificarEstado();
  }

  verificarEstado(): void {
    this.cargando = true;
    this.cajaService.obtenerEstado().subscribe({
      next: (data: any) => {
        this.estadoCaja = data.estado; // "ABIERTA" o "CERRADA"
        this.datosCaja = data;
        this.cargando = false;
        this.montoInput = null; // Limpiar input
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  abrirCaja(): void {
    if (this.montoInput === null || this.montoInput < 0) {
      Swal.fire('Atención', 'Ingresa un monto inicial válido.', 'warning');
      return;
    }

    this.cajaService.abrirCaja(this.montoInput).subscribe({
      next: () => {
        Swal.fire('¡Caja Abierta!', 'Buen turno de ventas.', 'success');
        this.verificarEstado(); // Recargar vista
      },
      error: (err) => Swal.fire('Error', err.error.error || 'No se pudo abrir.', 'error')
    });
  }

  cerrarCaja(): void {
    if (this.montoInput === null || this.montoInput < 0) {
      Swal.fire('Atención', 'Ingresa el dinero que contaste físicamente.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Cerrar Caja?',
      text: `Estás declarando que hay S/ ${this.montoInput} en efectivo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarCierre();
      }
    });
  }

  ejecutarCierre(): void {
    this.cajaService.cerrarCaja(this.montoInput!).subscribe({
      next: (res: any) => {
        // Lógica para mostrar si cuadró o no
        const diferencia = res.diferencia;
        let mensaje = '';
        let icono: any = 'success';

        if (diferencia == 0) {
          mensaje = '¡Caja Cuadrada Perfectamente! 🎉';
        } else if (diferencia < 0) {
          mensaje = `Falta dinero: S/ ${diferencia.toFixed(2)} ⚠️`;
          icono = 'warning';
        } else {
          mensaje = `Sobra dinero: S/ +${diferencia.toFixed(2)} 🤑`;
          icono = 'info';
        }

        Swal.fire('Reporte de Cierre', mensaje, icono);
        this.verificarEstado(); // Volver a estado CERRADA
      },
      error: (err) => Swal.fire('Error', err.error.error || 'No se pudo cerrar.', 'error')
    });
  }
}
