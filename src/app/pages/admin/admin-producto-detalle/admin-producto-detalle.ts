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
  public baseUrl = 'http://192.168.1.34:8080'; // Asegúrate que sea tu IP correcta

  // Variables para la galería
  public imagenActual: string | null = null;

  // Variable para el Modal de Eliminación
  public productoAEliminar: any = null;

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
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.error = "No se pudo cargar el producto.";
        this.cargando = false;
      }
    });
  }

  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  cambiarImagen(urlRelativa: string): void {
    this.imagenActual = this.baseUrl + urlRelativa;
  }

  // --- LÓGICA DEL MODAL (NUEVA) ---

  // 1. Botón "Eliminar" abre el modal
  confirmarEliminacion(producto: any): void {
    this.productoAEliminar = producto;
  }

  // 2. Botón "Cancelar" cierra el modal
  cancelarEliminacion(): void {
    this.productoAEliminar = null;
  }

  // 3. Botón "Sí, Eliminar" ejecuta el borrado
  eliminarDefinitivamente(): void {
    if (this.productoAEliminar) {
      this.productoService.deleteProducto(this.productoAEliminar.idProducto).subscribe({
        next: () => {
          // Ya no necesitamos alert, simplemente redirigimos
          this.productoAEliminar = null;
          this.router.navigate(['/admin/productos']);
        },
        error: (err: any) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el producto. Puede que tenga ventas asociadas.');
          this.productoAEliminar = null;
        }
      });
    }
  }
}
