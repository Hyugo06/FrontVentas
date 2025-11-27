import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto } from '../../services/producto';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { take } from 'rxjs/operators'; // <-- AÑADE ESTO
import { Modal } from '../../services/modal'; // <-- AÑADE ESTO
import { Observable, forkJoin } from 'rxjs';
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

  // --- NUEVAS VARIABLES PARA EL CARRUSEL ---
  // Mapa que guarda TODAS las imágenes únicas por producto
  public mapaImagenesProducto: { [idProducto: number]: string[] } = {};
  // Mapa que guarda el índice actual que se está viendo
  public indicesCarrusel: { [idProducto: number]: number } = {};

  // Mapas de selección
  public colorSeleccionado: { [idProducto: number]: string } = {};
  public seleccion: { [idProducto: number]: any } = {};

  // --- ¡NUEVA VARIABLE! Mapa para controlar la imagen de cada tarjeta ---
  // Clave: idProducto, Valor: URL de la imagen a mostrar
  public imagenesSeleccionadas: { [idProducto: number]: string } = {};

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
        this.inicializarSeleccion(); // <-- Importante llamar a esto al filtrar también
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

  // --- MÉTODO ACTUALIZADO ---
  /**
   * Inicializa las selecciones por defecto (Color, Talla e IMAGEN)
   */
  inicializarSeleccion(): void {
    this.productos.forEach(prod => {
      // Usamos un Set para evitar URLs repetidas
      const imagenesSet = new Set<string>();

      // 1. Agregar Imagen Principal del Producto
      if (prod.urlImagen) imagenesSet.add(prod.urlImagen);

      // 2. Agregar Imágenes de las Variantes
      if (prod.variantes) {
        prod.variantes.forEach((v: any) => {
          // A. Foto principal de la variante
          if (v.urlImagen) imagenesSet.add(v.urlImagen);

          // B. Galería extra de la variante (¡ESTO FALTABA!)
          if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
            v.galeriaImagenes.forEach((url: string) => imagenesSet.add(url));
          }
        });
      }

      // Convertir a Array
      this.mapaImagenesProducto[prod.idProducto] = Array.from(imagenesSet);
      this.indicesCarrusel[prod.idProducto] = 0;

      // Debug: Ver en consola cuántas fotos encontró
      // console.log(`Producto ${prod.nombre} tiene ${imagenesSet.size} fotos`);

      // Pre-selección de color (tu lógica existente)
      if (prod.variantes && prod.variantes.length > 0) {
        this.colorSeleccionado[prod.idProducto] = prod.variantes[0].color;
      }
    });
  }

  nextImage(event: Event, prodId: number): void {
    event.preventDefault();
    event.stopPropagation();
    const totalImages = this.mapaImagenesProducto[prodId].length;
    if (totalImages > 1) {
      // Incrementa índice y da la vuelta si llega al final (bucle)
      this.indicesCarrusel[prodId] = (this.indicesCarrusel[prodId] + 1) % totalImages;
    }
  }

  prevImage(event: Event, prodId: number): void {
    event.preventDefault();
    event.stopPropagation();
    const totalImages = this.mapaImagenesProducto[prodId].length;
    if (totalImages > 1) {
      // Decrementa índice y da la vuelta si llega al principio
      this.indicesCarrusel[prodId] = (this.indicesCarrusel[prodId] - 1 + totalImages) % totalImages;
    }
  }

  getCurrentImage(prodId: number): string | null {
    const images = this.mapaImagenesProducto[prodId];
    const index = this.indicesCarrusel[prodId];
    if (images && images.length > 0) {
      return images[index];
    }
    return null;
  }

  // --- MÉTODO ACTUALIZADO ---
  seleccionarColor(prod: any, color: string): void {
    // 1. Lógica existente de selección
    this.colorSeleccionado[prod.idProducto] = color;
    this.seleccion[prod.idProducto] = null; // Resetea la talla

    // 2. --- ¡NUEVA LÓGICA! Cambiar la foto de la tarjeta ---
    // Buscamos si hay una variante de este color que tenga foto
    const varianteDeColor = prod.variantes.find((v: any) => v.color === color && v.urlImagen);

    if (varianteDeColor) {
      this.imagenesSeleccionadas[prod.idProducto] = varianteDeColor.urlImagen;
    } else {
      // Si este color no tiene foto, volvemos a la foto principal (o la primera disponible)
      // Si prod.urlImagen es null, mantenemos la que estaba (que puede ser la de otro color) o buscamos un fallback
      this.imagenesSeleccionadas[prod.idProducto] = prod.urlImagen || this.imagenesSeleccionadas[prod.idProducto];
    }
  }

  // ... (resto de métodos: getColoresUnicos, getTallasPorColor, seleccionarTalla, agregarAlCarrito, etc.)

  getColoresUnicos(prod: any): string[] {
    if (!prod.variantes) return [];
    const colores = prod.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(prod: any, color: string): any[] {
    if (!prod.variantes) return [];
    return prod.variantes.filter((v: any) => v.color === color);
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
  }

  public agregarAlCarrito(event: MouseEvent, producto: any, variante?: any): void {
    event.stopPropagation();
    event.preventDefault();

    // 1. Validación de Variante requerida
    if (producto.variantes?.length > 0 && !variante) {
      this.modalService.open("Por favor selecciona un color y talla."); // Usa modal aquí también
      return;
    }

    // 2. Determinar Stock Máximo real
    const stockMaximo = variante ? variante.stockActual : producto.stockActual;

    // 3. Consultar el carrito actual para ver cuántos tenemos ya
    this.cartService.items$.pipe(take(1)).subscribe(items => {

      // Buscamos si este producto+variante ya está en el carrito
      const itemEnCarrito = items.find(i =>
        i.producto.idProducto === producto.idProducto &&
        i.variante?.idVariante === variante?.idVariante
      );

      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

      // 4. Validar si podemos añadir uno más
      if (cantidadEnCarrito + 1 > stockMaximo) {
        this.modalService.open(`Stock insuficiente. Ya tienes ${cantidadEnCarrito} en el carrito y solo quedan ${stockMaximo} disponibles.`);
      } else {
        // Si hay espacio, añadimos
        this.cartService.addItem(producto, variante);
        // (Opcional: Aquí podrías mostrar un mensajito de "Añadido" si quisieras)
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: CategoriaDTO[]) => {
        this.categoriasPadre = data.filter(c => c.idCategoriaPadre == null);
        this.categoriasHijo = data.filter(c => c.idCategoriaPadre != null);
        this.categorias = data;
      },
      error: (err: any) => { console.error('Error al traer categorías:', err); }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({ search: '', categoria: '' }, { emitEvent: false });
    this.cargarProductosIniciales();
  }

  setCategoriaFiltro(nombreCategoria: string): void {
    this.filtroForm.get('categoria')?.setValue(nombreCategoria);
  }

  getStockTotalColor(prod: any, color: string): number {
    if (!prod.variantes || !color) return 0;
    return prod.variantes
      .filter((v: any) => v.color === color)
      .reduce((sum: number, v: any) => sum + v.stockActual, 0);
  }

  public toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
