import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // <-- ¡Importa Router!
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
  public baseUrl = 'http://localhost:8080'; // O tu IP

  // Variables para la galería
  public imagenActual: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router, // <-- ¡INYECTA EL ROUTER!
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

  // --- ¡MÉTODO PARA ELIMINAR! ---
  eliminarProducto(): void {
    if (!this.producto) return;

    if (confirm(`¿Estás seguro de que quieres eliminar "${this.producto.nombre}" permanentemente?`)) {

      this.productoService.deleteProducto(this.producto.idProducto).subscribe({
        next: () => {
          alert('Producto eliminado con éxito.');
          // --- ¡AQUÍ ESTÁ LA REDIRECCIÓN! ---
          this.router.navigate(['/admin/productos']);
        },
        error: (err: any) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el producto. Puede que tenga ventas asociadas.');
        }
      });
    }
  }
}
