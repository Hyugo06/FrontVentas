import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Esta es la "forma" de los datos que esperamos
export interface CategoriaDTO {
  idCategoria: number;
  nombre: string;
  idCategoriaPadre: number | null; // <-- ¡AÑADE ESTA LÍNEA!
}

@Injectable({
  providedIn: 'root'
})
export class Categoria { // Tu CLI crea la clase 'Categoria'

  private apiUrl = 'http://localhost:8080/api/categorias'; // (O 8081)
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Obtiene la lista de todas las categorías
   */
  public getCategorias(): Observable<CategoriaDTO[]> {
    return this.http.get<CategoriaDTO[]>(this.apiUrl);
  }
}
