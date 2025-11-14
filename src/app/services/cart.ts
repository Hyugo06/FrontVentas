import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // Importamos BehaviorSubject

// Definimos cómo se verá un item en el carrito
export interface CartItem {
  producto: any; // Usamos 'any' por ahora para el producto
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cart { // Tu CLI crea la clase 'Cart'

  // 1. El "estado" privado: una lista de items
  // BehaviorSubject guarda la lista actual y la emite a los suscriptores
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);

  // 2. El "Observable" público: los componentes se suscriben a esto
  public items$ = this.itemsSubject.asObservable();

  constructor() { }

  /**
   * Lógica para añadir un producto al carrito
   */
  public addItem(producto: any): void {
    // Obtenemos la lista actual de items del BehaviorSubject
    const itemsActuales = this.itemsSubject.getValue();

    // Buscamos si el producto ya está en el carrito
    const itemEnCarrito = itemsActuales.find(item =>
      item.producto.idProducto === producto.idProducto
    );
    if (itemEnCarrito) {
      // Si ya está, solo aumentamos la cantidad
      itemEnCarrito.cantidad++;
    } else {
      // Si es nuevo, lo añadimos a la lista con cantidad 1
      itemsActuales.push({
        producto: producto,
        cantidad: 1
      });
    }

    // Emitimos la nueva lista (actualizada) a todos los suscriptores
    this.itemsSubject.next(itemsActuales);
  }

  public clearCart(): void {
    // Emite una lista vacía
    this.itemsSubject.next([]);
  }
  // (Aquí irían otros métodos como: eliminarItem(), vaciarCarrito(), etc.)
}
