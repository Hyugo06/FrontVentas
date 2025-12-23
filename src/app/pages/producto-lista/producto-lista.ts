import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <--- Importante para que funcione el enlace
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Producto } from '../../services/producto';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { Cart } from '../../services/cart';

interface CategoriaTree extends CategoriaDTO {
  children?: CategoriaDTO[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './producto-lista.html',
  styleUrl: './producto-lista.css'
})
export class ProductoListaComponent implements OnInit {

  public productos: any[] = [];
  public categorias: CategoriaDTO[] = [];
  public categoriasTree: CategoriaTree[] = [];
  public cargandoProductos: boolean = true;
  public filtroForm: FormGroup;
  public showMobileMenu: boolean = false;

  public mapaImagenes: { [id: number]: string[] } = {};
  public indiceImagen: { [id: number]: number } = {};
  public colorSeleccionado: { [id: number]: string } = {};
  public seleccion: { [id: number]: any } = {};

  public baseUrl = 'http://192.168.1.34:8080';

  constructor(
    private productoService: Producto,
    private cartService: Cart,
    private fb: FormBuilder,
    private categoriaService: Categoria
  ) {
    this.filtroForm = this.fb.group({
      search: [''],
      categoria: ['']
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();

    this.filtroForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.cargandoProductos = true),
      switchMap(val => this.productoService.getProductosPublicos(val.search, val.categoria))
    ).subscribe({
      next: (data) => {
        this.inicializarCarruseles(data); // <--- Aquí ocurre la magia de preselección
        this.productos = data;
        this.cargandoProductos = false;
      },
      error: () => this.cargandoProductos = false
    });

    this.filtroForm.updateValueAndValidity({ emitEvent: true });
  }

  // ==========================================
  // 🧠 LÓGICA DE PRESELECCIÓN Y GALERÍA
  // ==========================================

  inicializarCarruseles(productos: any[]): void {
    productos.forEach(prod => {
      this.indiceImagen[prod.idProducto] = 0;

      // 1. Buscamos los colores disponibles
      const colores = this.getColoresUnicos(prod);

      if (colores.length > 0) {
        // 2. ¡PRESELECCIONAMOS EL PRIMERO AUTOMÁTICAMENTE! 🎯
        const primerColor = colores[0];
        this.colorSeleccionado[prod.idProducto] = primerColor;

        // 3. Construimos la galería filtrada por ese color inicial
        this.construirGaleria(prod, primerColor);
      } else {
        // Si no tiene variantes, mostramos todo normal
        this.colorSeleccionado[prod.idProducto] = '';
        this.construirGaleria(prod, null);
      }
    });
  }

  getImagenActual(prod: any): string | null {
    const id = prod.idProducto;
    const imagenes = this.mapaImagenes[id];
    const indice = this.indiceImagen[id];
    if (imagenes && imagenes.length > 0 && typeof indice === 'number') {
      return imagenes[indice] || null;
    }
    return null;
  }

  construirGaleria(prod: any, colorFiltro: string | null): void {
    let urls: string[] = [];
    if (!colorFiltro) {
      if (prod.urlImagen) urls.push(this.baseUrl + prod.urlImagen);
      if (prod.imagenes) prod.imagenes.forEach((img: any) => urls.push(this.baseUrl + img.urlImagen));
      if (prod.variantes) {
        prod.variantes.forEach((v: any) => {
          if (v.urlImagen) urls.push(this.baseUrl + v.urlImagen);
          if (v.galeriaImagenes) v.galeriaImagenes.forEach((u: string) => urls.push(this.baseUrl + u));
        });
      }
    } else {
      const variantesColor = prod.variantes.filter((v: any) => v.color === colorFiltro);
      variantesColor.forEach((v: any) => {
        if (v.galeriaImagenes) v.galeriaImagenes.forEach((u: string) => urls.push(this.baseUrl + u));
        if (v.urlImagen) urls.push(this.baseUrl + v.urlImagen);
      });
      // Fallback si el color no tiene foto
      if (urls.length === 0 && prod.urlImagen) urls.push(this.baseUrl + prod.urlImagen);
    }
    this.mapaImagenes[prod.idProducto] = [...new Set(urls)];
    this.indiceImagen[prod.idProducto] = 0;
  }

  cambiarImagen(prod: any, direccion: number): void {
    const id = prod.idProducto;
    const total = this.mapaImagenes[id]?.length || 0;
    if (total <= 1) return;
    let nuevoIndice = this.indiceImagen[id] + direccion;
    if (nuevoIndice < 0) nuevoIndice = total - 1;
    if (nuevoIndice >= total) nuevoIndice = 0;
    this.indiceImagen[id] = nuevoIndice;
  }

  // --- SELECCIÓN ---
  seleccionarColor(prod: any, color: string): void {
    const id = prod.idProducto;

    // Si da click al mismo color, NO lo deseleccionamos (siempre debe haber uno activo)
    if (this.colorSeleccionado[id] === color) return;

    this.colorSeleccionado[id] = color;
    this.seleccion[id] = null; // Reseteamos la talla porque cambió el color
    this.construirGaleria(prod, color);
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
  }

  agregarAlCarrito(event: Event, producto: any, varianteSeleccionada: any): void {
    event.stopPropagation();

    if (producto.variantes?.length > 0 && !varianteSeleccionada) {
      Swal.fire({
        title: 'Falta la talla',
        text: 'Por favor selecciona una talla para continuar',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Verificamos el stock disponible vs lo que ya tiene en el carrito
    this.cartService.items$.pipe(take(1)).subscribe(items => {
      const uid = varianteSeleccionada
        ? `${producto.idProducto}-${varianteSeleccionada.idVariante}`
        : `${producto.idProducto}-base`;

      const itemEnCarrito = items.find(i => i.uid === uid);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const stockMaximo = varianteSeleccionada
        ? varianteSeleccionada.stockActual
        : producto.stockActual;

      if (cantidadEnCarrito + 1 > stockMaximo) {
        Swal.fire({
          title: '¡Stock Máximo Alcanzado!',
          text: `Ya tienes las ${stockMaximo} unidades disponibles en tu carrito.`,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: '#fff5f5',
          iconColor: '#ef4444'
        });
        return;
      }

      // Si pasa la validación, agregamos
      this.cartService.addToCart(producto, varianteSeleccionada, 1);
      Swal.fire({
        title: '¡Agregado!',
        text: `${producto.nombre} se agregó al carrito`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff',
        iconColor: '#10b981'
      });
    });
  }

  // --- HELPERS ---
  getColoresUnicos(prod: any): string[] {
    if (!prod.variantes) return [];
    return [...new Set(prod.variantes.map((v: any) => v.color).filter((c: any) => c))] as string[];
  }

  getTallasPorColor(prod: any, color: string): any[] {
    if (!prod.variantes) return [];
    return prod.variantes.filter((v: any) => v.color === color);
  }

  getStockTotalColor(prod: any, color: string): number {
    return this.getTallasPorColor(prod, color).reduce((acc, v) => acc + v.stockActual, 0);
  }

  getStockTotalProducto(prod: any): number {
    if (prod.variantes?.length > 0) {
      return prod.variantes.reduce((sum: number, v: any) => sum + v.stockActual, 0);
    }
    return prod.stockActual || 0;
  }

  // --- RESTO IGUAL ---
  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        const padres = data.filter(c => !c.idCategoriaPadre) as CategoriaTree[];
        padres.forEach(padre => {
          padre.children = data.filter(c => c.idCategoriaPadre === padre.idCategoria);
          padre.isOpen = false;
        });
        this.categoriasTree = padres;
      },
      error: (err) => console.error(err)
    });
  }
  toggleMobileMenu(): void { this.showMobileMenu = !this.showMobileMenu; }
  toggleCategoria(cat: CategoriaTree): void { cat.isOpen = !cat.isOpen; }
  filtrarPorCategoria(id: any): void { this.filtroForm.patchValue({ categoria: id }); this.showMobileMenu = false; }
  setCategoriaFiltro(nombre: string): void { this.filtroForm.patchValue({ categoria: nombre }); }
  verTodo(): void { this.filtroForm.patchValue({ categoria: '', search: '' }); this.showMobileMenu = false; }
  limpiarFiltros(): void { this.filtroForm.reset({ search: '', categoria: '' }); }
}
