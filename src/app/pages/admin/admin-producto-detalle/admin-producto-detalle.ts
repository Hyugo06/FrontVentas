import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Producto } from '../../../services/producto';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-producto-detalle.html',
  styleUrl: './admin-producto-detalle.css'
})
export class AdminProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenesGlobales: any[] = []; // Guardamos todas las del backend aquí
  public cargando: boolean = true;
  public error: string | null = null;
  public baseUrl = 'http://192.168.1.34:8080';

  // --- VARIABLES PARA LA GALERÍA DINÁMICA ---
  public imagenActual: string | null = null;
  public imagenesMostradas: string[] = []; // Esta es la lista que se ve en pantalla
  public colorSeleccionado: string | null = null; // Para saber qué tarjeta resaltar

  public productoAEliminar: any = null;
  public variantesAgrupadas: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: Producto
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = "No se proporcionó un ID.";
      this.cargando = false;
      return;
    }

    this.cargando = true;
    forkJoin({
      producto: this.productoService.getProductoAdminPorId(id),
      imagenes: this.productoService.getImagenesPorProducto(id)
    }).subscribe({
      next: (resultado: any) => {
        this.producto = resultado.producto;
        this.imagenesGlobales = resultado.imagenes; // Guardamos respaldo
        this.cargando = false;

        // 1. Organizar variantes
        if (this.producto.variantes) {
          this.organizarVariantes(this.producto.variantes);
        }

        // 2. Inicializar la galería con TODAS las fotos
        this.mostrarTodasLasFotos();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error = "No se pudo cargar el producto.";
        this.cargando = false;
      }
    });
  }

  // --- LÓGICA DE GALERÍA (NUEVA) ---

  mostrarTodasLasFotos(): void {
    this.colorSeleccionado = null;

    // 1. Creamos una lista temporal para acumular TODO lo que encontremos
    let todasLasUrls: string[] = [];

    // A) Agregamos la Imagen Principal (si existe)
    if (this.producto.urlImagen) {
      todasLasUrls.push(this.baseUrl + this.producto.urlImagen);
    }

    // B) Agregamos la Galería Global (si existe)
    if (this.imagenesGlobales.length > 0) {
      this.imagenesGlobales.forEach(img => {
        todasLasUrls.push(this.baseUrl + img.urlImagen);
      });
    }

    // C) Agregamos las imágenes de CADA variante
    // (Esto asegura que si subiste una foto solo a una variante, también salga en "Ver todas")
    if (this.variantesAgrupadas.length > 0) {
      this.variantesAgrupadas.forEach(grupo => {
        if (grupo.imagenes && grupo.imagenes.length > 0) {
          grupo.imagenes.forEach((urlRelativa: string) => {
            todasLasUrls.push(this.baseUrl + urlRelativa);
          });
        }
      });
    }

    // 2. EL TRUCO DE MAGIA: Eliminamos duplicados exactos usando Set 🪄
    this.imagenesMostradas = [...new Set(todasLasUrls)];

    // 3. Reseteamos la imagen principal a la primera de la lista limpia
    if (this.imagenesMostradas.length > 0) {
      this.imagenActual = this.imagenesMostradas[0];
    } else {
      this.imagenActual = null;
    }
  }

  filtrarPorColor(grupo: any): void {
    // Si ya estaba seleccionado, lo deseleccionamos (volvemos a ver todas)
    if (this.colorSeleccionado === grupo.color) {
      this.mostrarTodasLasFotos();
      return;
    }

    this.colorSeleccionado = grupo.color;

    // Si el grupo tiene fotos, las mostramos
    if (grupo.imagenes && grupo.imagenes.length > 0) {
      this.imagenesMostradas = grupo.imagenes.map((url: string) => this.baseUrl + url);
      this.imagenActual = this.imagenesMostradas[0];
    } else {
      // Si el grupo NO tiene fotos específicas, mostramos la imagen principal del producto como fallback
      if (this.producto.urlImagen) {
        this.imagenesMostradas = [this.baseUrl + this.producto.urlImagen];
        this.imagenActual = this.imagenesMostradas[0];
      } else {
        this.imagenesMostradas = [];
        this.imagenActual = null;
      }
    }
  }

  cambiarImagen(urlCompleta: string): void {
    this.imagenActual = urlCompleta;
  }

  // --- (El resto sigue igual: organizarVariantes, eliminar, etc.) ---

  private organizarVariantes(variantes: any[]): void {
    const grupos = new Map<string, any>();
    variantes.forEach(v => {
      const colorKey = v.color || 'Sin Color';
      if (!grupos.has(colorKey)) {
        grupos.set(colorKey, {
          color: colorKey,
          tallas: [],
          stockTotal: 0,
          imagenes: []
        });
      }
      const grupo = grupos.get(colorKey);
      grupo.tallas.push({ talla: v.talla, stock: v.stockActual });
      grupo.stockTotal += v.stockActual;

      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        v.galeriaImagenes.forEach((url: string) => {
          if (!grupo.imagenes.includes(url)) grupo.imagenes.push(url);
        });
      }
      if (v.urlImagen && !grupo.imagenes.includes(v.urlImagen)) {
        grupo.imagenes.push(v.urlImagen);
      }
    });
    this.variantesAgrupadas = Array.from(grupos.values());
  }

  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  confirmarEliminacion(producto: any): void {
    this.productoAEliminar = producto;
  }
  cancelarEliminacion(): void {
    this.productoAEliminar = null;
  }
  eliminarDefinitivamente(): void {
    if (this.productoAEliminar) {
      this.productoService.deleteProducto(this.productoAEliminar.idProducto).subscribe({
        next: () => {
          this.productoAEliminar = null;
          this.router.navigate(['/admin/productos']);
        },
        error: (err: any) => {
          console.error(err);
          this.productoAEliminar = null;
        }
      });
    }
  }
}
