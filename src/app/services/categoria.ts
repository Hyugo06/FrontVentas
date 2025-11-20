import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoriaDTO {
  idCategoria: number;
  nombre: string;
  idCategoriaPadre: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class Categoria { // Tu clase 'Categoria'

  //private publicApiUrl = 'http://192.168.1.34:8080/api/categorias';
  //private adminApiUrl = 'http://192.168.1.34:8080/api/admin/categorias';

  private publicApiUrl = 'http://localhost:8080/api/categorias';
  private adminApiUrl = 'http://localhost:8080/api/admin/categorias';

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
