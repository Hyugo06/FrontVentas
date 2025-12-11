import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import {Producto} from '../../services/producto';

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
    this.searchForm.get('search')!.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => this.cargando = true),
      switchMap(searchTerm => {
        return this.productoService.getProductosAdmin(searchTerm);
      })
    ).subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'No se pudieron cargar los productos.';
        this.cargando = false;
      }
    });

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
          this.error = 'No se pudo eliminar el producto.';
          this.productoAEliminar = null;
        }
      });
    }
  }
}
