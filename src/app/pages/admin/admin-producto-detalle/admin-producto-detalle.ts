import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Importa RouterLink
import { Producto } from '../../../services/producto'; // Tu servicio de Producto
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- Asegúrate de tener CommonModule y RouterLink
  templateUrl: './admin-producto-detalle.html',
  styleUrl: './admin-producto-detalle.css'
})
export class AdminProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(
    private route: ActivatedRoute,
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
      // ¡Llama al método de ADMIN para obtener el precioCompra!
      producto: this.productoService.getProductoAdminPorId(id),
      // Llama al método público para las imágenes
      imagenes: this.productoService.getImagenesPorProducto(id)
    }).subscribe({
      next: (resultado: any) => {
        this.producto = resultado.producto;
        this.imagenes = resultado.imagenes;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar detalles de admin:', err);
        this.error = "No se pudo cargar el producto.";
        this.cargando = false;
      }
    });
  }

  /**
   * Helper para que el HTML pueda iterar sobre el JSONB de características
   */
  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }
}
