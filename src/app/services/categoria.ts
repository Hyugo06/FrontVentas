import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment.prod';

export interface CategoriaDTO {
  idCategoria: number;
  nombre: string;
  codigoCorto?: string;      // Nuevo campo (Opcional)
  descripcion?: string;      // Nuevo campo (Opcional)
  idCategoriaPadre: number | null;
  rutaCompleta?: string;     // <--- ¡NUESTRO CAMPO ESTRELLA!
  nivel?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Categoria { // Tu clase 'Categoria'

  private publicApiUrl = `${environment.apiUrl}/api/categorias`;
  private adminApiUrl = `${environment.apiUrl}/api/admin/categorias`;

  private http = inject(HttpClient);
  constructor() { }

  // --- (Método público existente) ---
  public getCategorias(): Observable<CategoriaDTO[]> {
    return this.http.get<CategoriaDTO[]>(this.publicApiUrl);
  }

  // --- ¡AÑADE ESTOS 5 MÉTODOS CRUD! ---

  /**
   * Obtiene la lista COMPLETA de categorías para el dashboard de admin
   */
  public getCategoriasAdmin(): Observable<CategoriaDTO[]> {
    return this.http.get<CategoriaDTO[]>(this.adminApiUrl);
  }

  public getCategoriaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/${id}`);
  }

  public createCategoria(data: any): Observable<any> {
    return this.http.post<any>(this.adminApiUrl, data);
  }

  public updateCategoria(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}`, data);
  }

  public deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`);
  }
}
