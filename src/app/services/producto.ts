import { Injectable, inject } from '@angular/core';
// ¡Añade HttpParams!
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Producto { // Tu clase 'Producto'

  private publicApiUrl = 'http://localhost:8080/api/productos'; // (O 8081)
  private adminApiUrl = 'http://localhost:8080/api/admin/productos'; // (O 8081)
  private http = inject(HttpClient);

  constructor() { }

  // --- ¡MÉTODO MODIFICADO! ---
  /**
   * Obtiene la lista pública de productos, aplicando filtros.
   */
  public getProductosPublicos(search: string | null, categoria: string | null): Observable<any[]> {

    let params = new HttpParams();
    if (search) {
      params = params.append('search', search);
    }
    if (categoria) {
      params = params.append('categoria', categoria);
    }

    return this.http.get<any[]>(this.publicApiUrl, { params: params });
  }

  // --- (El resto de tus métodos: getProductoPublicoPorId, getImagenesPorProducto, getProductosAdmin, etc., se quedan igual) ---

  public getProductoPublicoPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.publicApiUrl}/${id}`);
  }

  public getImagenesPorProducto(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.publicApiUrl}/${id}/imagenes`);
  }

  public getProductosAdmin(): Observable<any[]> {
    return this.http.get<any[]>(this.adminApiUrl);
  }

  public getProductoAdminPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/${id}`);
  }

  public createProducto(productoData: any): Observable<any> {
    return this.http.post<any>(this.adminApiUrl, productoData);
  }

  public updateProducto(id: number, productoData: any): Observable<any> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}`, productoData);
  }

  public deleteProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`);
  }
}
