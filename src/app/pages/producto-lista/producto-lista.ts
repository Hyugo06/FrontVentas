import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../services/producto';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

// --- ¡AÑADE ESTA IMPORTACIÓN! ---
import { Cart } from '../../services/cart';

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './producto-lista.html',
  styleUrl: './producto-lista.css'
})
export class ProductoListaComponent implements OnInit {

  public productos: any[] = [];
  public categoriasPadre: CategoriaDTO[] = [];
  public categoriasHijo: CategoriaDTO[] = [];
  public categorias: CategoriaDTO[] = [];
  public cargandoProductos: boolean = true;
  public filtroForm: FormGroup;
  public showMobileMenu: boolean = false;

  constructor(
    private productoService: Producto,
    private categoriaService: Categoria,
    private fb: FormBuilder,
    private cartService: Cart // <-- ¡INYECTA EL SERVICIO DE CARRITO!
  ) {
    this.filtroForm = this.fb.group({
      search: [''],
      categoria: ['']
    });
  }

  public toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  // ... (tu ngOnInit, cargarProductosIniciales, cargarCategorias, limpiarFiltros y setCategoriaFiltro
  //      están perfectos y se quedan igual) ...
  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductosIniciales();

    this.filtroForm.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.cargandoProductos = true),
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

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDTO[]) => {

        // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
        // Ahora que el backend envía 'idCategoriaPadre', podemos filtrar:

        // 1. Categorías Padre (las que tienen idCategoriaPadre == null)
        // (Ej: Ropa, Hogar)
        this.categoriasPadre = data.filter(c => c.idCategoriaPadre == null);

        // 2. Categorías Hija (las que tienen idCategoriaPadre != null)
        // (Ej: Gorras, Polos, Sábanas)
        this.categoriasHijo = data.filter(c => c.idCategoriaPadre != null);

        // (La lista completa 'categorias' ya no se usa para el bucle principal,
        // pero la dejamos por si acaso la necesitas para otra cosa)
        this.categorias = data;
      },
      error: (err: any) => {
        console.error('Error al traer categorías:', err);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ search: '', categoria: '' }, { emitEvent: false });
    this.cargarProductosIniciales();
  }

  setCategoriaFiltro(nombreCategoria: string): void {
    this.filtroForm.get('categoria')?.setValue(nombreCategoria);
  }

  // --- ¡AÑADE ESTE NUEVO MÉTODO! ---
  /**
   * Añade un producto al carrito directamente desde la lista.
   * 'event.stopPropagation()' evita que el 'routerLink' de la tarjeta se active.
   */
  public agregarAlCarrito(event: MouseEvent, producto: any): void {
    event.stopPropagation(); // <-- ¡Muy importante! Detiene el clic en la tarjeta
    event.preventDefault(); // <-- Detiene el comportamiento del enlace <a>

    this.cartService.addItem(producto);
    console.log('Añadido desde la lista:', producto.nombre);

    // (Opcional: podrías añadir una pequeña animación o feedback aquí)
  }
}
