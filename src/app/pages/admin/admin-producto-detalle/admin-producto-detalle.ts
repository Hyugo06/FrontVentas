import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Producto } from '../../../services/producto';
import { forkJoin } from 'rxjs';
import {environment} from '../../../../environments/environment.prod';

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
  public baseUrl = environment.apiUrl;

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

    let todasLasUrls: string[] = [];

    // A) Imagen Principal
    if (this.producto.urlImagen) {
      // CAMBIO AQUÍ:
      todasLasUrls.push(this.resolverUrlImagen(this.producto.urlImagen));
    }

    // B) Galería Global
    if (this.imagenesGlobales.length > 0) {
      this.imagenesGlobales.forEach(img => {
        // CAMBIO AQUÍ:
        todasLasUrls.push(this.resolverUrlImagen(img.urlImagen));
      });
    }

    // C) Variantes
    if (this.variantesAgrupadas.length > 0) {
      this.variantesAgrupadas.forEach(grupo => {
        if (grupo.imagenes && grupo.imagenes.length > 0) {
          grupo.imagenes.forEach((urlRelativa: string) => {
            // CAMBIO AQUÍ:
            todasLasUrls.push(this.resolverUrlImagen(urlRelativa));
          });
        }
      });
    }

    this.imagenesMostradas = [...new Set(todasLasUrls)];

    if (this.imagenesMostradas.length > 0) {
      this.imagenActual = this.imagenesMostradas[0];
    } else {
      this.imagenActual = null;
    }
  }




  filtrarPorColor(grupo: any): void {
    if (this.colorSeleccionado === grupo.color) {
      this.mostrarTodasLasFotos();
      return;
    }

    this.colorSeleccionado = grupo.color;

    if (grupo.imagenes && grupo.imagenes.length > 0) {
      // CAMBIO AQUÍ: Usamos resolverUrlImagen
      this.imagenesMostradas = grupo.imagenes.map((url: string) => this.resolverUrlImagen(url));
      this.imagenActual = this.imagenesMostradas[0];
    } else {
      if (this.producto.urlImagen) {
        // CAMBIO AQUÍ:
        this.imagenesMostradas = [this.resolverUrlImagen(this.producto.urlImagen)];
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

  // Función auxiliar para saber si concatenar la base URL o usar la de Cloudinary
  public resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png'; // O tu imagen por defecto

    // Si la url ya tiene "http", es de Cloudinary -> La dejamos tal cual
    if (url.startsWith('http')) {
      return url;
    }

    // Si no, es una imagen antigua o local -> Le pegamos la baseUrl
    // Nota: Asegúrate de si necesitas agregar '/media/' o no, dependiendo de cómo guardabas antes
    return this.baseUrl + url;
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
