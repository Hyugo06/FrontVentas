import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Venta } from '../../../services/venta';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-ventas',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-ventas.html',
  styleUrl: './admin-ventas.css'
})
export class AdminVentasComponent implements OnInit {

  public menuTipoAbierto: boolean = false;
  public ventas: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public menuEstadoAbierto: boolean = false;
  public filtroForm: FormGroup;
  public ventasFiltradas: any[] = [];
  public sortState = {
    sortBy: 'fechaVenta', // Columna por defecto
    order: 'desc'        // Orden por defecto
  };

  constructor(
    private ventaService: Venta,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.filtroForm = this.fb.group({
      termino: [''],
      comprobante: [''],
      fechaInicio: [''],
      fechaFin: [''],
      estado: ['']
    });
  }

  public anularVenta(venta: any): void {
    Swal.fire({
      title: '¿Anular esta venta?',
      text: `Se anulará el comprobante ${venta.numeroComprobante} por S/ ${venta.montoTotal}. Esta acción devolverá el stock a los productos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: 'Sí, anular venta',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamamos a un método en tu servicio de ventas (debes crearlo en el backend)
        this.ventaService.anularVenta(venta.idVenta).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Venta Anulada!',
              text: 'El monto ha sido restado de las métricas y el stock restaurado.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarVentas(); // Recargamos la lista para ver el cambio
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo anular la venta. Inténtalo más tarde.', 'error');
          }
        });
      }
    });
  }

  public seleccionarComprobante(valor: string): void {
    this.filtroForm.get('comprobante')?.setValue(valor);
    this.menuTipoAbierto = false;
    this.aplicarFiltrosLocalmente();
  }


  public seleccionarEstado(valor: string): void {
    this.filtroForm.get('estado')?.setValue(valor);
    this.menuEstadoAbierto = false;
    this.aplicarFiltrosLocalmente();
  }

  ngOnInit(): void {
    // 1. Suscribirse a los cambios del formulario (para el uso manual)
    this.filtroForm.valueChanges.subscribe(() => {
      this.cargarVentas();
    });

    // 2. Leer parámetros de la URL (para cuando vienes del Dashboard)
    this.route.queryParams.subscribe(params => {
      if (params['fechaInicio'] && params['fechaFin']) {

        console.log("Filtros desde URL detectados:", params); // Para depurar

        // Actualizamos el formulario visualmente
        // emitEvent: false evita que se dispare el valueChanges de arriba y cargue doble
        this.filtroForm.patchValue({
          fechaInicio: params['fechaInicio'],
          fechaFin: params['fechaFin']
        }, { emitEvent: false });

        // Forzamos la carga inmediata con estos datos
        this.cargarVentas();
      } else {
        // Si no hay params, carga inicial normal
        this.cargarVentas();
      }
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    const filtros = { ...this.sortState, ...this.filtroForm.value };

    this.ventaService.getVentas(filtros).subscribe({
      next: (data: any) => {
        this.ventas = data;
        this.aplicarFiltrosLocalmente(); // <-- LLAMAMOS AL NUEVO FILTRO
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  public aplicarFiltrosLocalmente(): void {
    const term = this.filtroForm.get('termino')?.value?.toLowerCase() || '';
    const estadoFiltro = this.filtroForm.get('estado')?.value;
    const tipoFiltro = this.filtroForm.get('comprobante')?.value;

    this.ventasFiltradas = this.ventas.filter(v => {
      // BUSQUEDA POR TERMINO (Nombre, DNI o ID)
      const matchTermino = !term ||
        v.cliente?.nombres?.toLowerCase().includes(term) ||
        v.cliente?.apellidos?.toLowerCase().includes(term) ||
        v.cliente?.dni?.includes(term) ||
        v.idVenta.toString().includes(term);

      // Filtros de estado y tipo (se mantienen igual)
      const matchEstado = !estadoFiltro ||
        (estadoFiltro === 'ACTIVA' ? v.estado !== 'ANULADA' : v.estado === 'ANULADA');
      const matchTipo = !tipoFiltro || (v.tipoComprobante || '').toUpperCase() === tipoFiltro;

      return matchTermino && matchEstado && matchTipo;
    });
  }

  ordenarPor(columna: string): void {
    if (this.sortState.sortBy === columna) {
      // Si ya está ordenada por esta columna, invertimos el orden
      this.sortState.order = this.sortState.order === 'asc' ? 'desc' : 'asc';
    } else {
      // Si es una nueva columna, la ponemos como principal
      this.sortState.sortBy = columna;
      this.sortState.order = 'asc'; // Por defecto ascendente
    }
    // Recargamos las ventas con el nuevo orden
    this.cargarVentas();
  }

  public limpiarFiltros(): void {
    this.filtroForm.reset({
      comprobante: '',
      estado: '',
      fechaInicio: '',
      fechaFin: ''
    });
    this.menuTipoAbierto = false;
    this.menuEstadoAbierto = false;
    this.cargarVentas();
  }


}
