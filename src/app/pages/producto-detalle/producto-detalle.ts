import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto, ProductoVariante } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Cart } from '../../services/cart';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = []; // (Mantener por compatibilidad)
  public cargando: boolean = true;
  public activeTab: string = 'details';

  // --- VARIABLES DE SELECCIÓN ---
  public colorSeleccionado: string | null = null;
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

          // Pre-seleccionar el primer color disponible
          if (this.producto.variantes && this.producto.variantes.length > 0) {
            this.colorSeleccionado = this.producto.variantes[0].color;
          }
        },
        error: (err) => { console.error(err); this.cargando = false; }
      });
    }
  }

  // --- LÓGICA DE SELECTORES (Igual que en la lista) ---

  getColoresUnicos(): string[] {
    if (!this.producto?.variantes) return [];
    const colores = this.producto.variantes.map((v: any) => v.color);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(color: string): any[] {
    if (!this.producto?.variantes) return [];
    return this.producto.variantes.filter((v: any) => v.color === color);
  }

  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
    this.varianteSeleccionada = null; // Resetea talla
  }

  seleccionarTalla(variante: any): void {
    this.varianteSeleccionada = variante;
  }

  // --- CARRITO ---

  public agregarAlCarrito(): void {
    if (this.producto.variantes?.length > 0 && !this.varianteSeleccionada) {
      alert("Por favor, selecciona una Talla.");
      return;
    }
    this.cartService.addItem(this.producto, this.varianteSeleccionada);
    // (Opcional: feedback visual)
  }

  public objectEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }
}
