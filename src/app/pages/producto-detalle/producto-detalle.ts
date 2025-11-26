import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto, ProductoVariante } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Cart } from '../../services/cart';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = [];
  public imagenesFiltradas: any[] = [];
  public cargando: boolean = true;
  public activeTab: string = 'details';

  // --- VARIABLES DE SELECCIÓN DE VARIANTES ---
  public colorSeleccionado: string | null = null;
  public varianteSeleccionada: ProductoVariante | null = null;

  // --- ¡NUEVAS VARIABLES PARA GALERÍA! ---
  public imagenActual: string | null = null;
  public baseUrl = 'http://localhost:8080'; // O tu IP si usas móvil (ej. 192.168.1.X)

  constructor(
    private route: ActivatedRoute,
    private productoService: Producto,
    private cartService: Cart
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      forkJoin({
        producto: this.productoService.getProductoPublicoPorId(id),
        imagenes: this.productoService.getImagenesPorProducto(id)
      }).subscribe({
        next: (resultado: any) => {
          this.producto = resultado.producto;
          this.imagenes = resultado.imagenes;
          this.imagenesFiltradas = this.imagenes;
          this.cargando = false;

          // --- LÓGICA DE IMAGEN INICIAL ---
          if (this.producto.urlImagen) {
            // Si hay imagen principal, la usamos
            this.imagenActual = this.baseUrl + this.producto.urlImagen;
          } else if (this.imagenes.length > 0) {
            // Si no, usamos la primera de la galería
            this.imagenActual = this.baseUrl + this.imagenes[0].urlImagen;
          }

          // --- LÓGICA DE VARIANTE INICIAL ---
          if (this.producto.variantes && this.producto.variantes.length > 0) {
            this.colorSeleccionado = this.producto.variantes[0].color;
          }
        },
        error: (err) => { console.error(err); this.cargando = false; }
      });
    }
  }



  // --- MÉTODO PARA CAMBIAR LA IMAGEN GRANDE ---
  cambiarImagen(urlRelativa: string): void {
    this.imagenActual = this.baseUrl + urlRelativa;
  }

  // --- LÓGICA DE SELECTORES ---
  getColoresUnicos(): string[] {
    if (!this.producto?.variantes) return [];
    const colores = this.producto.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(color: string): any[] {
    if (!this.producto?.variantes) return [];
    return this.producto.variantes.filter((v: any) => v.color === color);
  }

  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
    this.varianteSeleccionada = null;
    const variantesDeColor = this.producto.variantes.filter((v:any) => v.color === color);
    const idsVariantes = variantesDeColor.map((v:any) => v.idVariante);
    this.imagenesFiltradas = this.imagenes.filter(img =>
      img.idVariante == null || idsVariantes.includes(img.idVariante)
    );
    const primeraFotoVariante = this.imagenesFiltradas.find(img => img.idVariante != null);

    if (primeraFotoVariante) {
      this.cambiarImagen(primeraFotoVariante.urlImagen);
    } else if (this.imagenesFiltradas.length > 0) {
      this.cambiarImagen(this.imagenesFiltradas[0].urlImagen);
    }
  }

  seleccionarTalla(variante: any): void {
    this.varianteSeleccionada = variante;
  }

  // --- CARRITO ---
  public agregarAlCarrito(): void {
    if (this.producto.variantes?.length > 0 && !this.varianteSeleccionada) {
      alert("Por favor, selecciona una Talla.");
      return;
    }
    this.cartService.addItem(this.producto, this.varianteSeleccionada);
  }

  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  navegarImagen(direccion: number): void {
    if (!this.imagenActual || this.imagenesFiltradas.length <= 1) return;

    // 1. Encontrar el índice de la imagen actual
    // Quitamos el baseUrl para comparar solo la ruta relativa
    const currentUrlRelativa = this.imagenActual.replace(this.baseUrl, '');

    const currentIndex = this.imagenesFiltradas.findIndex(img => img.urlImagen === currentUrlRelativa);

    if (currentIndex !== -1) {
      // 2. Calcular nuevo índice con bucle (wrap around)
      const totalImages = this.imagenesFiltradas.length;
      let newIndex = (currentIndex + direccion) % totalImages;

      // Manejar índices negativos (al ir hacia atrás desde el 0)
      if (newIndex < 0) newIndex = totalImages - 1;

      // 3. Cambiar la imagen
      this.cambiarImagen(this.imagenesFiltradas[newIndex].urlImagen);
    }
  }
}
