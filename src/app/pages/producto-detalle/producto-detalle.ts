import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto, ProductoVariante } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { Cart } from '../../services/cart';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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

  // Selección
  public colorSeleccionado: string | null = null;
  public tallaSeleccionada: string | null = null;
  public varianteSeleccionada: ProductoVariante | null = null;

  // Galería
  public imagenActual: string | null = null;
  // public baseUrl = 'https://apiventas-1.onrender.com'; // YA NO LO USAREMOS DIRECTAMENTE

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
          this.cargando = false;

          const colores = this.getColoresUnicos();
          if (colores.length > 0) {
            this.seleccionarColor(colores[0]);
          } else {
            // Si no hay variantes, usamos las imágenes globales
            this.imagenesFiltradas = this.imagenes;
            if (this.producto?.urlImagen) {
              this.imagenActual = this.resolverUrlImagen(this.producto.urlImagen);
            } else if (this.imagenes.length > 0) {
              this.imagenActual = this.resolverUrlImagen(this.imagenes[0].urlImagen);
            }
          }
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
    }
  }

  // --- NUEVA FUNCIÓN INTELIGENTE (Pública para el HTML) ---
  resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';

    // 1. Si ya es de Cloudinary (empieza con http), la dejamos tal cual
    if (url.startsWith('http')) {
      return url;
    }

    // 2. Si es una imagen antigua (ruta relativa), le pegamos tu dominio de Render
    return 'https://apiventas-1.onrender.com' + url;
  }

  // --- LÓGICA DE FILTRADO Y SELECCIÓN ---

  seleccionarColor(color: string): void {
    if (!this.producto?.variantes) return;

    this.colorSeleccionado = color;
    this.tallaSeleccionada = null;
    this.varianteSeleccionada = null;

    const variantesDeColor = this.producto.variantes.filter((v: any) => v.color === color);
    let fotosDelColor: any[] = [];

    variantesDeColor.forEach((v: any) => {
      // A. Fotos de la galería nueva
      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        v.galeriaImagenes.forEach((url: string) => {
          fotosDelColor.push({ urlImagen: url, idVariante: v.idVariante });
        });
      }
      // B. Foto legacy
      if (v.urlImagen) {
        fotosDelColor.push({ urlImagen: v.urlImagen, idVariante: v.idVariante });
      }
    });

    // Eliminar duplicados
    const fotosUnicas = new Map();
    fotosDelColor.forEach(foto => {
      if (!fotosUnicas.has(foto.urlImagen)) {
        fotosUnicas.set(foto.urlImagen, foto);
      }
    });

    this.imagenesFiltradas = Array.from(fotosUnicas.values());

    if (this.imagenesFiltradas.length === 0 && this.producto?.urlImagen) {
      this.imagenesFiltradas = [{ urlImagen: this.producto.urlImagen, idVariante: null }];
    }

    // Poner la primera foto en el visor
    if (this.imagenesFiltradas.length > 0) {
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

  // --- HELPERS ---
  getColoresUnicos(): string[] {
    if (!this.producto?.variantes) return [];
    const colores = this.producto.variantes.map((v: any) => v.color).filter((c: any) => c);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(color: string | null): string[] {
    if (!this.producto?.variantes || !color) return [];
    const tallas = this.producto.variantes
      .filter((v: any) => v.color === color)
      .map((v: any) => v.talla);
    return [...new Set(tallas)] as string[];
  }

  getStockTotalColor(color: string | null): number {
    if (!this.producto?.variantes || !color) return 0;
    return this.producto.variantes
      .filter((v: any) => v.color === color)
      .reduce((acc: number, v: any) => acc + v.stockActual, 0);
  }

  isTallaDisponible(talla: string): boolean {
    if (!this.colorSeleccionado || !this.producto?.variantes) return false;
    const variante = this.producto.variantes.find((v: any) =>
      v.color === this.colorSeleccionado && v.talla === talla
    );
    return variante ? variante.stockActual > 0 : false;
  }

  // --- GALERÍA (CORREGIDA) ---

  cambiarImagen(url: string): void {
    // Usamos el resolver directamente
    this.imagenActual = this.resolverUrlImagen(url);
  }

  navegarImagen(direccion: number): void {
    if (!this.imagenActual || this.imagenesFiltradas.length <= 1) return;

    // Buscamos el índice comparando las URLs resueltas (ya procesadas)
    const currentIndex = this.imagenesFiltradas.findIndex(img =>
      this.resolverUrlImagen(img.urlImagen) === this.imagenActual
    );

    if (currentIndex !== -1) {
      const total = this.imagenesFiltradas.length;
      let newIndex = (currentIndex + direccion) % total;
      if (newIndex < 0) newIndex = total - 1;
      // Actualizamos
      this.cambiarImagen(this.imagenesFiltradas[newIndex].urlImagen);
    }
  }

  // --- CARRITO ---
  agregarAlCarrito(): void {
    if (this.producto?.variantes?.length > 0 && !this.varianteSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona una talla',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    this.cartService.items$.pipe(take(1)).subscribe(items => {
      const uid = this.varianteSeleccionada
        ? `${this.producto.idProducto}-${this.varianteSeleccionada.idVariante}`
        : `${this.producto.idProducto}-base`;

      const itemEnCarrito = items.find(i => i.uid === uid);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const stockMaximo = this.varianteSeleccionada
        ? this.varianteSeleccionada.stockActual
        : this.producto.stockActual;

      if (cantidadEnCarrito + 1 > stockMaximo) {
        Swal.fire({
          title: '¡Stock Máximo Alcanzado!',
          text: `Ya tienes las ${stockMaximo} unidades disponibles en tu carrito.`,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 4000,
          background: '#fff5f5',
          iconColor: '#ef4444'
        });
        return;
      }

      this.cartService.addToCart(this.producto, this.varianteSeleccionada, 1);

      Swal.fire({
        icon: 'success',
        title: 'Agregado al carrito',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 3000,
        background: '#ffffff',
        iconColor: '#10b981'
      });
    });
  }
}
