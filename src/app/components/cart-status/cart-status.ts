import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart';
import { RouterLink } from '@angular/router'; // <-- ¡AÑADE RouterLink!

@Component({
  selector: 'app-cart-status',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- ¡AÑADE RouterLink!
  templateUrl: './cart-status.html',
  styleUrl: './cart-status.css'
})
export class CartStatusComponent {

  // ¡MODIFICADO! Ya no necesitamos la lista de items, solo el CONTEO
  public totalItems$: Observable<number>;

  constructor(private cartService: Cart) {
    // Nos suscribimos al nuevo observable de conteo total
    this.totalItems$ = this.cartService.totalItems$;
  }
}
