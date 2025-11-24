import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Venta } from '../../../services/venta';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-admin-ventas',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-ventas.html',
  styleUrl: './admin-ventas.css'
})
export class AdminVentasComponent implements OnInit {

  public ventas: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public filtroForm: FormGroup;
  public sortState = {
    sortBy: 'fechaVenta', // Columna por defecto
    order: 'desc'        // Orden por defecto
  };

  constructor(
    private ventaService: Venta,
    private fb: FormBuilder, // Inyectamos FormBuilder
    private route: ActivatedRoute
  ) {
    // Creamos el formulario reactivo para los filtros
    this.filtroForm = this.fb.group({
      comprobante: [''], // Dropdown de comprobante
      fechaInicio: [''], // Calendario 1
      fechaFin: ['']      // Calendario 2
    });
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
    this.error = null;

    const filtros = {
      ...this.sortState,
      ...this.filtroForm.value
    };

    this.ventaService.getVentas(filtros).subscribe({
      next: (data: any) => {
        this.ventas = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando ventas:', err);
        this.error = 'No se pudieron cargar las ventas.';
        this.cargando = false;
      }
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

  /**
   * Limpia todos los filtros y recarga
   */
  limpiarFiltros(): void {
    this.filtroForm.reset({
      comprobante: '',
      fechaInicio: '',
      fechaFin: ''
    });
    // this.cargarVentas(); // Se recarga automáticamente por el valueChanges
  }


}
