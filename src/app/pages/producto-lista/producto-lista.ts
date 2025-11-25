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

  public seleccion: { [idProducto: number]: any } = {};

  // ... (ngOnInit y cargarProductos) ...

  /**
   * Se ejecuta cuando cargan los productos para pre-seleccionar la primera opción
   */
  inicializarSeleccion(): void {
    this.productos.forEach(prod => {
      if (prod.variantes && prod.variantes.length > 0) {
        // Por defecto, seleccionamos el primer color disponible
        // Pero NO seleccionamos una variante final todavía (opcional)
        const primerColor = prod.variantes[0].color;
        this.colorSeleccionado[prod.idProducto] = primerColor;

        // Opcional: Pre-seleccionar la primera variante válida de ese color
        const variantePorDefecto = this.getTallasPorColor(prod, primerColor)[0];
        if (variantePorDefecto) {
          this.seleccion[prod.idProducto] = variantePorDefecto;
        }
      }
    });
  }

  seleccionarVariante(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
  }

  getColoresUnicos(prod: any): string[] {
    if (!prod.variantes) return [];
    const colores = prod.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[]; // Elimina duplicados
  }

  getTallasPorColor(prod: any, color: string): any[] {
    if (!prod.variantes) return [];
    return prod.variantes.filter((v: any) => v.color === color);
  }


  public colorSeleccionado: { [idProducto: number]: string } = {};

  public toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  seleccionarColor(prod: any, color: string): void {
    this.colorSeleccionado[prod.idProducto] = color;

    const tallasDisponibles = this.getTallasPorColor(prod, color);
    console.log(`Colores para ${prod.nombre}:`, tallasDisponibles); // <--- ¡MIRA ESTO EN LA CONSOLA!

    if (tallasDisponibles.length > 0) {
      // NO selecciones automáticamente la talla, deja que el usuario elija
      // this.seleccion[prod.idProducto] = tallasDisponibles[0];
      this.seleccion[prod.idProducto] = null; // Resetea la selección para obligar al usuario a elegir talla
    } else {
      this.seleccion[prod.idProducto] = null;
    }
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
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
        this.inicializarSeleccion();
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
  public agregarAlCarrito(event: MouseEvent, producto: any, variante?: any): void {
    event.stopPropagation();
    event.preventDefault();

    // Si el producto tiene variantes pero no se seleccionó ninguna (error defensivo)
    if (producto.variantes?.length > 0 && !variante) {
      alert("Por favor selecciona una opción.");
      return;
    }

    // Pasamos la variante al servicio (que ya actualizamos para aceptarla)
    this.cartService.addItem(producto, variante);

    // (Opcional: Mostrar un toast/notificación)
  }
}
