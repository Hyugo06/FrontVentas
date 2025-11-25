import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto, ProductoVariante } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Cart } from '../../services/cart'; // Inyectamos el carrito
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // Añade FormsModule
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = [];
  public cargando: boolean = true;

  public activeTab: string = 'details';

  // --- ¡NUEVO! Para manejar la selección ---
  public varianteSeleccionada: ProductoVariante | null = null;

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

          // Si el producto tiene variantes, seleccionamos la primera por defecto (opcional)
          if (this.producto.variantes && this.producto.variantes.length > 0) {
            // this.varianteSeleccionada = this.producto.variantes[0];
          }
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
    }
  }

  // Helper para JSONB
  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  // --- ¡MÉTODO MODIFICADO! ---
  public agregarAlCarrito(): void {
    // Validación: Si el producto tiene variantes, debe seleccionar una
    if (this.producto.variantes && this.producto.variantes.length > 0 && !this.varianteSeleccionada) {
      alert("Por favor, selecciona una opción (Color/Talla).");
      return;
    }

    this.cartService.addItem(this.producto, this.varianteSeleccionada);
    alert("Producto añadido al carrito");
  }
}
