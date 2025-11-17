import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ¡Necesario!
import { RouterLink } from '@angular/router'; // ¡Necesario!
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart'; // ¡Importa el servicio!
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- ¡Añade los imports!
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css'
})
export class CartPageComponent {

  public items$: Observable<CartItem[]>;
  public total$: Observable<number>; // Observable para el precio total

  constructor(private cartService: Cart) {
    // 1. Obtenemos la lista de items
    this.items$ = this.cartService.items$;

    // 2. Calculamos el total
    this.total$ = this.items$.pipe(
      map(items =>
        items.reduce((total, item) => total + (item.producto.precioVenta * item.cantidad), 0)
      )
    );
  }

  // --- Métodos para los botones ---

  incrementar(producto: any): void {
    this.cartService.addItem(producto);
  }

  decrementar(producto: any): void {
    this.cartService.decrementItem(producto);
  }

  eliminar(producto: any): void {
    this.cartService.removeItem(producto);
  }
}
