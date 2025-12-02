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
  public imagenes: any[] = [];            // Todas las imágenes (sin filtrar)
  public imagenesFiltradas: any[] = [];   // Imágenes que se ven actualmente (filtradas)
  public cargando: boolean = true;
  public activeTab: string = 'details';
  public tallaSeleccionada: string | null = null;

  // --- VARIABLES DE SELECCIÓN DE VARIANTES ---
  public colorSeleccionado: string | null = null;
  public varianteSeleccionada: ProductoVariante | null = null;

  // --- VARIABLES PARA GALERÍA ---
  public imagenActual: string | null = null;
  public baseUrl = 'http://localhost:8080'; // O tu IP

  // --- ¡NUEVO! MAPA DE COLORES (Traducción Español -> CSS) ---
  private colorMap: { [key: string]: string } = {
    'rojo': '#EF4444',    // Red
    'negro': '#000000',   // Black
    'blanco': '#FFFFFF',  // White
    'azul': '#3B82F6',    // Blue
    'verde': '#22C55E',   // Green
    'amarillo': '#EAB308',// Yellow
    'gris': '#9CA3AF',    // Gray
    'rosa': '#EC4899',    // Pink
    'morado': '#A855F7',  // Purple
    'azul marino': '#1E3A8A', // Dark Blue
    'celeste': '#38BDF8',
    'beige': '#F5F5DC',
    'marrón': '#78350F',
    'naranja': '#F97316',
    'vino': '#722F37'
  };

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

          // Inicialmente mostramos TODAS las imágenes (Generales + Variantes)
          this.imagenesFiltradas = this.imagenes;

          this.cargando = false;

          // 1. Lógica de Imagen Inicial
          if (this.producto.urlImagen) {
            this.imagenActual = this.baseUrl + this.producto.urlImagen;
          } else if (this.imagenes.length > 0) {
            this.imagenActual = this.baseUrl + this.imagenes[0].urlImagen;
          }
        },
        error: (err) => { console.error(err); this.cargando = false; }
      });
    }
  }

  // --- ¡MÉTODO HELPER PARA EL COLOR! ---
  getColorHex(nombreColor: string): string {
    if (!nombreColor) return 'transparent';
    const key = nombreColor.toLowerCase().trim();
    // Retorna el valor del mapa, o el nombre original si no existe (por si acaso es "red" o hex)
    return this.colorMap[key] || nombreColor;
  }

  getTallasUnicas(): string[] {
    if (!this.producto?.variantes) return [];
    const tallas = this.producto.variantes.map((v: any) => v.talla);
    // Ordenar tallas si es necesario (S, M, L, XL...)
    return [...new Set(tallas)] as string[];
  }

  getTallasVisibles(): string[] {
    if (!this.producto?.variantes) return [];

    let variantesAConsiderar = this.producto.variantes;

    // Si hay color seleccionado, filtramos primero por ese color
    if (this.colorSeleccionado) {
      variantesAConsiderar = variantesAConsiderar.filter((v: any) => v.color === this.colorSeleccionado);
    }

    const tallas = variantesAConsiderar.map((v: any) => v.talla);
    return [...new Set(tallas)] as string[];
  }

  isCombinacionDisponible(color: string | null, talla: string | null): boolean {
    if (!this.producto?.variantes) return false;

    // Si falta alguno, no podemos validar la combinación final, pero el botón individual está activo
    if (!color && !talla) return true;

    return this.producto.variantes.some((v: any) => {
      const matchColor = color ? v.color === color : true;
      const matchTalla = talla ? v.talla === talla : true;
      return matchColor && matchTalla && v.stockActual > 0;
    });
  }
  // --- LÓGICA DE GALERÍA ---

  cambiarImagen(urlRelativa: string): void {
    this.imagenActual = this.baseUrl + urlRelativa;
  }

  navegarImagen(direccion: number): void {
    if (!this.imagenActual || this.imagenesFiltradas.length <= 1) return;

    const currentUrlRelativa = this.imagenActual.replace(this.baseUrl, '');
    const currentIndex = this.imagenesFiltradas.findIndex(img => img.urlImagen === currentUrlRelativa);

    if (currentIndex !== -1) {
      const totalImages = this.imagenesFiltradas.length;
      let newIndex = (currentIndex + direccion) % totalImages;
      if (newIndex < 0) newIndex = totalImages - 1;

      this.cambiarImagen(this.imagenesFiltradas[newIndex].urlImagen);
    }
  }

  // --- LÓGICA DE SELECTORES Y FILTRADO ---

  getColoresUnicos(): string[] {
    if (!this.producto?.variantes) return [];
    const colores = this.producto.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(color: string): any[] {
    if (!this.producto?.variantes) return [];
    return this.producto.variantes.filter((v: any) => v.color === color);
  }

  // --- ¡MÉTODO ACTUALIZADO CON FILTRADO ESTRICTO! ---
  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
    this.varianteSeleccionada = null; // Resetea talla

    // 1. Identificar las variantes que corresponden a este color
    const variantesDeColor = this.producto.variantes.filter((v: any) => v.color === color);
    const idsVariantesDeColor = variantesDeColor.map((v: any) => v.idVariante);

    // 2. Filtrar la galería de imágenes
    this.imagenesFiltradas = this.imagenes.filter(img => {
      if (img.idVariante && idsVariantesDeColor.includes(img.idVariante)) {
        return true;
      }
      if (img.idVariante == null) {
        return true;
      }
      return false;
    });

    // 3. Actualizar la imagen principal (Visor)
    const primeraFotoVariante = this.imagenesFiltradas.find(img => img.idVariante != null);

    if (primeraFotoVariante) {
      this.cambiarImagen(primeraFotoVariante.urlImagen);
    } else if (this.imagenesFiltradas.length > 0) {
      this.cambiarImagen(this.imagenesFiltradas[0].urlImagen);
    }
  }

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
    this.actualizarVariante();
  }

  actualizarVariante(): void {
    if (this.colorSeleccionado && this.tallaSeleccionada) {
      this.varianteSeleccionada = this.producto.variantes.find((v: any) =>
        v.color === this.colorSeleccionado && v.talla === this.tallaSeleccionada
      ) || null;
    } else {
      this.varianteSeleccionada = null;
    }
  }

  getStockTotalReal(): number {
    if (this.producto?.variantes && this.producto.variantes.length > 0) {
      return this.producto.variantes.reduce((sum: number, v: any) => sum + v.stockActual, 0);
    }
    return this.producto?.stockActual || 0;
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
}
