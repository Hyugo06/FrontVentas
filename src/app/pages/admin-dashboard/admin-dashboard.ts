import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Para los botones de "Editar"
import { Producto } from '../../services/producto'; // Tu servicio de Producto

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // ¡Importa RouterLink!
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  public productos: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(private productoService: Producto) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = null;

    this.productoService.getProductosAdmin().subscribe({
      next: (data: any) => {
        this.productos = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando productos admin:', err);
        this.error = 'No se pudieron cargar los productos. ¿Estás seguro de que eres Admin?';
        this.cargando = false;
      }
    });
  }

  /**
   * Llama al servicio para eliminar un producto
   */
  eliminarProducto(id: number): void {
    // Pedimos confirmación
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => {
          console.log('Producto eliminado con ID:', id);
          // Recargamos la lista de productos
          this.cargarProductos();
        },
        error: (err: any) => {
          console.error('Error al eliminar producto:', err);
          this.error = 'No se pudo eliminar el producto.';
        }
      });
    }
  }
}
