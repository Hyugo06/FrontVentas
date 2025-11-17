import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// --- ¡IMPORTACIONES AÑADIDAS! ---
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import {Producto} from '../../services/producto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // --- ¡AÑADE ReactiveFormsModule! ---
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  public productos: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  public searchForm: FormGroup; // <-- Formulario para la búsqueda

  constructor(
    private productoService: Producto,
    private fb: FormBuilder // <-- Inyecta FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    // Escuchamos los cambios en la barra de búsqueda
    this.searchForm.get('search')!.valueChanges.pipe(
      debounceTime(350), // Espera 350ms después de teclear
      distinctUntilChanged(), // Solo busca si el texto cambió
      tap(() => this.cargando = true), // Muestra "Cargando..."
      // switchMap cancela la búsqueda anterior y lanza la nueva
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

    // Disparamos una búsqueda inicial (vacía) al cargar
    this.searchForm.get('search')!.setValue('');
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => {
          // Recargamos la lista actual (con el filtro de búsqueda)
          const currentSearch = this.searchForm.get('search')!.value;
          this.searchForm.get('search')!.setValue(currentSearch); // Dispara el valueChanges
        },
        error: (err: any) => {
          this.error = 'No se pudo eliminar el producto.';
        }
      });
    }
  }

  limpiarBusqueda(): void {
    this.searchForm.get('search')?.setValue('');
  }
}
