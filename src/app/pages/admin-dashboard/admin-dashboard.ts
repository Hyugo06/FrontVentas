import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap,catchError } from 'rxjs/operators';
import {Producto} from '../../services/producto';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  public productos: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public productoAEliminar: any = null; // Variable del Modal

  public searchForm: FormGroup;

  constructor(
    private productoService: Producto,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    // Suscripción al buscador "Blindada"
    this.searchForm.get('search')!.valueChanges.pipe(
      debounceTime(350),       // Espera a que termines de escribir
      distinctUntilChanged(),  // No busca si escribes lo mismo
      tap(() => {
        this.cargando = true;
        this.error = null;     // Limpiamos errores previos al buscar
      }),
      switchMap(searchTerm => {
        return this.productoService.getProductosAdmin(searchTerm).pipe(
          // --- AQUÍ ESTÁ EL TRUCO ---
          // Si la búsqueda falla, atrapamos el error AQUÍ DENTRO.
          // Esto evita que el buscador "muera" y deje de escuchar.
          catchError(err => {
            console.error('Error en búsqueda:', err);
            this.error = 'Ocurrió un error al buscar.';
            // Retornamos una lista vacía para que la interfaz sepa que terminó
            return of([]);
          })
        );
      })
    ).subscribe((data: any) => {
      // Como ya atrapamos el error arriba, aquí siempre llega data (vacía o llena)
      this.productos = data;
      this.cargando = false;
    });

    // Disparar la carga inicial
    this.searchForm.get('search')!.setValue('');
  }

  limpiarBusqueda(): void {
    this.searchForm.get('search')?.setValue('');
  }

  // --- FUNCIONES DEL MODAL (YA NO EXISTE eliminarProducto) ---

  // 1. Botón "Eliminar" de la tarjeta llama a esto
  confirmarEliminacion(producto: any): void {
    this.productoAEliminar = producto; // Esto abre el modal en el HTML
  }

  // 2. Botón "Cancelar" del modal
  cancelarEliminacion(): void {
    this.productoAEliminar = null;
  }

  cargarProductos(): void {
    this.cargando = true;
    const searchTerm = this.searchForm.get('search')?.value || '';

    this.productoService.getProductosAdmin(searchTerm).subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'No se pudieron cargar los productos.';
        this.cargando = false;
      }
    });
  }

  eliminarDefinitivamente(): void {
    if (this.productoAEliminar) {
      this.productoService.deleteProducto(this.productoAEliminar.idProducto).subscribe({
        next: () => {
          this.cargarProductos();
          this.productoAEliminar = null;
        },
        error: (err: any) => {
          console.error(err);
          // Seteamos el error
          this.error = 'No se puede eliminar este producto porque tiene ventas o registros asociados.';
          this.productoAEliminar = null;

          // AUTO-LIMPIEZA: El aviso desaparecerá solo tras 3.5 segundos
          setTimeout(() => {
            this.error = null;
          }, 1000);
        }
      });
    }
  }
}
