import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
// --- ¡CORRECCIÓN 1! ---
// Importamos la clase 'Producto' (que es tu servicio) desde el archivo 'producto'
import { Producto } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import {Cart} from '../../services/cart';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  // --- ¡CORRECCIÓN 2! ---
  // Apuntamos a los nombres de archivo correctos (sin .component)
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = [];
  public cargando: boolean = true;

  public activeTab: 'details' | 'specs' | 'media' = 'details';


  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  constructor(
    private route: ActivatedRoute,
    private productoService: Producto,
    private cartService: Cart // <-- ¡INYECTA EL SERVICIO!
  ) {}

  public agregarAlCarrito(): void {
    if (this.producto) {
      this.cartService.addItem(this.producto);
      console.log('Producto añadido:', this.producto.nombre);
    }
  }



  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      forkJoin({
        producto: this.productoService.getProductoPublicoPorId(id),
        imagenes: this.productoService.getImagenesPorProducto(id)
      }).subscribe({
        // --- ¡CORRECCIÓN 4! (Tipos 'any' para evitar errores) ---
        next: (resultado: any) => {
          this.producto = resultado.producto;
          this.imagenes = resultado.imagenes;
          this.cargando = false;
        },
        error: (err: any) => {
          console.error('Error al cargar detalles:', err);
          this.cargando = false;
        }
      });
    }
  }
}
