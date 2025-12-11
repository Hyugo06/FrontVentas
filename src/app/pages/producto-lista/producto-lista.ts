import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../services/producto';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { debounceTime, distinctUntilChanged, switchMap, tap, take } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';
import { Cart } from '../../services/cart';
import { Modal } from '../../services/modal';


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
  public categoriasPadre: CategoriaDTO[] = [];
  public categoriasHijo: CategoriaDTO[] = [];
  public categorias: CategoriaDTO[] = [];
  public cargandoProductos: boolean = true;
  public filtroForm: FormGroup;
  public showMobileMenu: boolean = false;
  public categoriasTree: CategoriaTree[] = [];

  // Mapas para gestionar el estado visual de cada tarjeta independientemente
  public mapaImagenesProducto: { [idProducto: number]: string[] } = {};
  public indicesCarrusel: { [idProducto: number]: number } = {};
  public imagenesSeleccionadas: { [idProducto: number]: string } = {};

  // Mapas para la selección de compra
  public colorSeleccionado: { [idProducto: number]: string } = {};
  public seleccion: { [idProducto: number]: any } = {}; // Variante final seleccionada

  // Mapa de Colores (Traducción Español -> CSS)
  private colorMap: { [key: string]: string } = {
    'rojo': '#EF4444',
    'negro': '#000000',
    'blanco': '#FFFFFF',
    'azul': '#3B82F6',
    'verde': '#22C55E',
    'amarillo': '#EAB308',
    'gris': '#9CA3AF',
    'rosa': '#EC4899',
    'morado': '#A855F7',
    'azul marino': '#1E3A8A',
    'celeste': '#38BDF8',
    'beige': '#F5F5DC',
    'marrón': '#78350F',
    'naranja': '#F97316',
    'vino': '#722F37'
  };

  constructor(
    private productoService: Producto,
    private categoriaService: Categoria,
    private fb: FormBuilder,
    private cartService: Cart,
    private modalService: Modal
  ) {
    this.filtroForm = this.fb.group({
      search: [''],
      categoria: ['']
    });
  }

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
        this.inicializarSeleccion();
        this.cargandoProductos = false;
      },
      error: (err: any) => {
        console.error('Error al traer productos filtrados:', err);
        this.cargandoProductos = false;
      }
    });
  }

  // --- ¡MÉTODO QUE FALTABA! ---
  // Calcula la suma del stock de todas las tallas de un color específico
  getStockTotalColor(prod: any, color: string): number {
    if (!prod.variantes || !color) return 0;
    return prod.variantes
      .filter((v: any) => v.color === color)
      .reduce((sum: number, v: any) => sum + v.stockActual, 0);
  }

  // --- MÉTODO HELPER DE COLOR ---
  getColorHex(nombreColor: string): string {
    if (!nombreColor) return 'transparent';
    const key = nombreColor.toLowerCase().trim();
    return this.colorMap[key] || nombreColor;
  }

  // --- CARGA Y LÓGICA INICIAL ---

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

  inicializarSeleccion(): void {
    this.productos.forEach(prod => {
      // 1. Recolectar imágenes
      const imagenesSet = new Set<string>();
      if (prod.urlImagen) imagenesSet.add(prod.urlImagen);
      if (prod.variantes) {
        prod.variantes.forEach((v: any) => {
          if (v.urlImagen) imagenesSet.add(v.urlImagen);
          if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
            v.galeriaImagenes.forEach((url: string) => imagenesSet.add(url));
          }
        });
      }
      this.mapaImagenesProducto[prod.idProducto] = Array.from(imagenesSet);
      this.indicesCarrusel[prod.idProducto] = 0;

      // 2. Imagen por defecto (Visor)
      let imagenInicial = prod.urlImagen;
      if (!imagenInicial && prod.variantes && prod.variantes.length > 0) {
        const varianteConFoto = prod.variantes.find((v: any) => v.urlImagen);
        if (varianteConFoto) imagenInicial = varianteConFoto.urlImagen;
      }
      if (imagenInicial) this.imagenesSeleccionadas[prod.idProducto] = imagenInicial;

      // 3. Pre-seleccionar primer color
      if (prod.variantes && prod.variantes.length > 0) {
        this.colorSeleccionado[prod.idProducto] = prod.variantes[0].color;
      }
    });
  }

  // --- SELECCIÓN E INTERACCIÓN ---

  seleccionarColor(prod: any, color: string): void {
    this.colorSeleccionado[prod.idProducto] = color;
    this.seleccion[prod.idProducto] = null; // Resetea la talla al cambiar color

    // Cambiar la foto de la tarjeta si el color tiene una foto específica
    const varianteDeColor = prod.variantes.find((v: any) => v.color === color && v.urlImagen);

    if (varianteDeColor) {
      this.imagenesSeleccionadas[prod.idProducto] = varianteDeColor.urlImagen;
    } else {
      // Si no, volvemos a la principal (o mantenemos la que estaba si es la principal)
      this.imagenesSeleccionadas[prod.idProducto] = prod.urlImagen || this.imagenesSeleccionadas[prod.idProducto];
    }
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
  }

  // --- CARRITO (CON VALIDACIÓN DE STOCK) ---

  public agregarAlCarrito(event: MouseEvent, producto: any, variante?: any): void {
    event.stopPropagation();
    event.preventDefault();

    // Validación básica
    if (producto.variantes?.length > 0 && !variante) {
      this.modalService.open("Por favor selecciona una opción (Color y Talla).");
      return;
    }

    const stockMaximo = variante ? variante.stockActual : producto.stockActual;

    // Validar contra lo que ya está en el carrito
    this.cartService.items$.pipe(take(1)).subscribe(items => {
      const itemEnCarrito = items.find(i =>
        i.producto.idProducto === producto.idProducto &&
        i.variante?.idVariante === variante?.idVariante
      );

      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

      if (cantidadEnCarrito + 1 > stockMaximo) {
        this.modalService.open(`Stock insuficiente. Ya tienes ${cantidadEnCarrito} en el carrito y solo quedan ${stockMaximo} disponibles.`);
      } else {
        this.cartService.addItem(producto, variante);
      }
    });
  }

  // --- MÉTODOS DE CARRUSEL ---

  nextImage(event: Event, prodId: number): void {
    event.preventDefault();
    event.stopPropagation();
    const totalImages = this.mapaImagenesProducto[prodId]?.length || 0;
    if (totalImages > 1) {
      this.indicesCarrusel[prodId] = (this.indicesCarrusel[prodId] + 1) % totalImages;
    }
  }

  prevImage(event: Event, prodId: number): void {
    event.preventDefault();
    event.stopPropagation();
    const totalImages = this.mapaImagenesProducto[prodId]?.length || 0;
    if (totalImages > 1) {
      this.indicesCarrusel[prodId] = (this.indicesCarrusel[prodId] - 1 + totalImages) % totalImages;
    }
  }

  getCurrentImage(prodId: number): string | null {
    const images = this.mapaImagenesProducto[prodId];
    const index = this.indicesCarrusel[prodId] || 0;
    if (images && images.length > 0) {
      return images[index];
    }
    return null;
  }

  // --- HELPERS DE VARIANTES ---

  getColoresUnicos(prod: any): string[] {
    if (!prod.variantes) return [];
    const colores = prod.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(prod: any, color: string): any[] {
    if (!prod.variantes) return [];
    return prod.variantes.filter((v: any) => v.color === color);
  }

  // --- CARGA DE CATEGORÍAS ---

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDTO[]) => {
        this.categorias = data;
        const padres = data.filter(c => !c.idCategoriaPadre) as CategoriaTree[];

        padres.forEach(padre => {
          padre.children = data.filter(c => c.idCategoriaPadre === padre.idCategoria);
          padre.isOpen = false;
        });
        this.categoriasTree = padres;
      },
      error: (err: any) => { console.error('Error al traer categorías:', err); }
    });
  }

  getStockTotalProducto(prod: any): number {
    if (prod.variantes && prod.variantes.length > 0) {
      return prod.variantes.reduce((sum: number, v: any) => sum + v.stockActual, 0);
    }
    return prod.stockActual || 0;
  }

  // --- FILTROS Y MENÚ ---

  limpiarFiltros(): void {
    this.filtroForm.reset({ search: '', categoria: '' }, { emitEvent: false });
    this.cargarProductosIniciales();
  }

  setCategoriaFiltro(nombreCategoria: string): void {
    this.filtroForm.get('categoria')?.setValue(nombreCategoria);
  }

  public toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
