import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../services/producto';
// ¡Añadimos ReactiveForms!
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
// ¡Añadimos CategoriaService!
import { Categoria, CategoriaDTO } from '../../services/categoria';
// ¡Añadimos herramientas de RxJS para la búsqueda!
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule], // <-- ¡Añade ReactiveFormsModule!
  templateUrl: './producto-lista.html',
  styleUrl: './producto-lista.css'
})
export class ProductoListaComponent implements OnInit {

  public productos: any[] = [];
  public categorias: CategoriaDTO[] = []; // Para la barra lateral
  public cargandoProductos: boolean = true;

  public filtroForm: FormGroup;

  constructor(
    private productoService: Producto,
    private categoriaService: Categoria, // Inyectamos el servicio
    private fb: FormBuilder
  ) {
    // Creamos el formulario para los filtros
    this.filtroForm = this.fb.group({
      search: [''],    // Para la barra de búsqueda
      categoria: [''] // Para el filtro de categoría
    });
  }

  ngOnInit(): void {
    // 1. Cargar las categorías para la barra lateral
    this.cargarCategorias();

    // 2. Cargar los productos iniciales (sin filtros)
    this.cargarProductosIniciales();

    // 3. Escuchar CUALQUIER cambio en el formulario (búsqueda O categoría)
    this.filtroForm.valueChanges.pipe(
      debounceTime(350), // Espera 350ms después de teclear
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.cargandoProductos = true), // Activa el "Cargando..."
      // switchMap cancela la petición anterior si se teclea de nuevo
      switchMap(filtros => {
        return this.productoService.getProductosPublicos(filtros.search, filtros.categoria);
      })
    ).subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cargandoProductos = false;
      },
      error: (err: any) => {
        console.error('Error al traer productos filtrados:', err);
        this.cargandoProductos = false;
      }
    });
  }

  /**
   * Carga la lista inicial de productos (sin filtros)
   */
  cargarProductosIniciales(): void {
    this.cargandoProductos = true;
    this.productoService.getProductosPublicos(null, null).subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cargandoProductos = false;
      },
      error: (err: any) => {
        console.error('Error al traer productos:', err);
        this.cargandoProductos = false;
      }
    });
  }

  /**
   * Carga la lista de categorías para el sidebar
   */
  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDTO[]) => {
        // Filtramos para mostrar solo las sub-categorías (las que tienen padre)
        this.categorias = data.filter(c => c.idCategoriaPadre != null);
      },
      error: (err: any) => {
        console.error('Error al traer categorías:', err);
      }
    });
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroForm.reset({ search: '', categoria: '' }, { emitEvent: false });
    this.cargarProductosIniciales(); // Recarga manual
  }

  /**
   * Establece el filtro de categoría (para los botones)
   */
  setCategoriaFiltro(nombreCategoria: string): void {
    this.filtroForm.get('categoria')?.setValue(nombreCategoria);
  }
}
