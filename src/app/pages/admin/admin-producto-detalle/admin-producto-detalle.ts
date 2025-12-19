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
  public imagenes: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public baseUrl = 'http://192.168.1.34:8080'; // Ajusta tu IP

  // Variables para la galería
  public imagenActual: string | null = null;

  // Variable para el Modal de Eliminación
  public productoAEliminar: any = null;

  // --- NUEVA VARIABLE PARA LA VISTA AGRUPADA ---
  public variantesAgrupadas: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: Producto
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = "No se proporcionó un ID de producto.";
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
        this.imagenes = resultado.imagenes;
        this.cargando = false;

        // Inicializar imagen principal
        if (this.producto.urlImagen) {
          this.imagenActual = this.baseUrl + this.producto.urlImagen;
        } else if (this.imagenes.length > 0) {
          this.imagenActual = this.baseUrl + this.imagenes[0].urlImagen;
        }

        // --- AQUÍ LLAMAMOS A LA FUNCIÓN DE AGRUPAR ---
        if (this.producto.variantes) {
          this.organizarVariantes(this.producto.variantes);
        }
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error = "No se pudo cargar el producto.";
        this.cargando = false;
      }
    });
  }

  // --- NUEVA FUNCIÓN PARA AGRUPAR POR COLOR ---
  private organizarVariantes(variantes: any[]): void {
    const grupos = new Map<string, any>();

    variantes.forEach(v => {
      const colorKey = v.color || 'Sin Color';

      if (!grupos.has(colorKey)) {
        grupos.set(colorKey, {
          color: colorKey,
          tallas: [],
          stockTotal: 0,
          imagenes: [] // Recolectamos fotos de todas las tallas de este color
        });
      }

      const grupo = grupos.get(colorKey);

      // Agregar talla
      grupo.tallas.push({
        talla: v.talla,
        stock: v.stockActual
      });
      grupo.stockTotal += v.stockActual;

      // Agregar imágenes (si existen en la variante)
      // 1. Galería nueva
      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        v.galeriaImagenes.forEach((url: string) => {
          if (!grupo.imagenes.includes(url)) grupo.imagenes.push(url);
        });
      }
      // 2. Imagen legacy
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

  cambiarImagen(urlRelativa: string): void {
    this.imagenActual = this.baseUrl + urlRelativa; // Se asegura de usar la base correcta
  }

  // --- LÓGICA DEL MODAL ---
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
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el producto.');
          this.productoAEliminar = null;
        }
      });
    }
  }
}
