import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

export interface CartItem {
  uid: string;
  producto: any;
  variante: any | null;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cart {
  private key = 'margarita_cart_storage';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();

  // Convertimos el getter en una propiedad pública real
  public totalItems$: Observable<number>;

  constructor() {
    this.cargarDeLocalStorage();

    // Inicializamos el observable derivado una sola vez
    this.totalItems$ = this.items$.pipe(
      map(items => items.reduce((acc, i) => acc + i.cantidad, 0))
    );
  }

  // MÉTODO BLINDADO: Verifica Stock antes de agregar
  addToCart(producto: any, variante: any | null, cantidad: number = 1): boolean {
    const items = this.itemsSubject.value;
    const uid = variante ? `${producto.idProducto}-${variante.idVariante}` : `${producto.idProducto}-base`;

    // 1. Determinar el Stock Máximo Real
    const stockDisponible = variante ? variante.stockActual : producto.stockActual;

    const existing = items.find(i => i.uid === uid);

    if (existing) {
      // 2. Validación: ¿La suma supera el stock?
      if (existing.cantidad + cantidad > stockDisponible) {
        Swal.fire({
          icon: 'error',
          title: 'Stock Insuficiente',
          text: `Solo quedan ${stockDisponible} unidades disponibles.`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        return false;
      }
      existing.cantidad += cantidad;
    } else {
      // 2. Validación para item nuevo
      if (cantidad > stockDisponible) {
        Swal.fire({
          icon: 'error',
          title: 'Stock Insuficiente',
          text: `Solo quedan ${stockDisponible} unidades disponibles.`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        return false;
      }
      items.push({ uid, producto, variante, cantidad });
    }

    this.actualizar(items);
    return true;
  }

  // Alias compatible
  addItem(producto: any, variante: any | null) {
    this.addToCart(producto, variante, 1);
  }

  decrementItem(item: CartItem) {
    const items = this.itemsSubject.value;
    const index = items.findIndex(i => i.uid === item.uid);

    if (index > -1) {
      if (items[index].cantidad > 1) {
        items[index].cantidad--;
      } else {
        items.splice(index, 1);
      }
      this.actualizar(items);
    }
  }

  removeItem(item: CartItem) {
    const items = this.itemsSubject.value.filter(i => i.uid !== item.uid);
    this.actualizar(items);
  }

  clearCart() {
    this.actualizar([]);
  }

  private actualizar(items: CartItem[]) {
    this.itemsSubject.next([...items]);
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  private cargarDeLocalStorage() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        this.itemsSubject.next(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar carrito", e);
      }
    }
  }
}
