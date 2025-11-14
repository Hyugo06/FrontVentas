import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ¡Necesario para el | async!
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart';
import {RouterLink} from '@angular/router'; // ¡Importamos el servicio y la interface!

@Component({
  selector: 'app-cart-status', // Este es el tag HTML: <app-cart-status>
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-status.html',
  styleUrl: './cart-status.css'
})
export class CartStatusComponent {

  // Creamos un Observable para los items del carrito
  public cartItems$: Observable<CartItem[]>;

  constructor(private cartService: Cart) {
    // Nos suscribimos al observable público del servicio
    this.cartItems$ = this.cartService.items$;
  }

  // (En el futuro, podríamos añadir aquí un método para calcular el total)
}
