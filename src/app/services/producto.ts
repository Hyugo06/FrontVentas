import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- ¡NUEVA INTERFAZ PARA VARIANTES! ---
export interface ProductoVariante {
  idVariante?: number;
  color: string;
  talla: string;
  skuVariante?: string;
  stockActual: number;
  urlImagen?: string;         // <--- FALTABA ESTE
  galeriaImagenes?: string[];
}
// ---------------------------------------

@Injectable({
  providedIn: 'root'
})
export class Producto {

  //private publicApiUrl = 'http://localhost:8080/api/productos';
  //private adminApiUrl = 'http://localhost:8080/api/admin/productos';

  // private publicApiUrl = 'http://192.168.1.34:8080/api/productos';
  // private adminApiUrl = 'http://192.168.1.34:8080/api/admin/productos';

  private publicApiUrl = 'https://apiventas-1.onrender.com/api/productos';
  private adminApiUrl = 'https://apiventas-1.onrender.com/api/admin/productos';

  constructor(private http: HttpClient) { }

  public getProductosPublicos(search: string | null, categoria: string | null): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.append('search', search);
    if (categoria) params = params.append('categoria', categoria);
    return this.http.get<any[]>(this.publicApiUrl, { params: params });
  }

  public getProductoPublicoPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.publicApiUrl}/${id}`);
  }

  public getImagenesPorProducto(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.publicApiUrl}/${id}/imagenes`);
  }

  public getProductosAdmin(search: string | null): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.append('search', search);
    return this.http.get<any[]>(this.adminApiUrl, { params: params });
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

  public agregarImagen(idProducto: number, imagenData: any): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/${idProducto}/imagenes`, imagenData);
  }

  public eliminarImagen(idImagen: number): Observable<void> {
    const urlBase = this.adminApiUrl.replace('/productos', '');
    return this.http.delete<void>(`${urlBase}/imagenes/${idImagen}`);
  }
}
