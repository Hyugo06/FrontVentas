import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
// Asegúrate de crear este archivo de interfaces en src/app/model/venta-request.dto.ts
import { VentaRequestDTO } from '../model/venta-request.dto';

@Injectable({
  providedIn: 'root'
})
export class Venta { // Tu clase 'Venta'

  private apiUrl = 'http://localhost:8080/api/ventas'; // Usa 8081 si cambiaste el puerto

  constructor(private http: HttpClient) { }

  /**
   * Envía la transacción final de venta al backend (POST /api/ventas).
   * El Interceptor añade el Basic Auth de forma segura.
   */
  public procesarVenta(ventaData: VentaRequestDTO): Observable<any> {
    // La respuesta esperada es un 201 Created con el objeto Venta completo
    return this.http.post<any>(this.apiUrl, ventaData);
  }

  public getVentas(filtros: any): Observable<any[]> {

    let params = new HttpParams();

    // Añadimos los parámetros solo si existen
    if (filtros.sortBy) {
      params = params.append('sortBy', filtros.sortBy);
    }
    if (filtros.order) {
      params = params.append('order', filtros.order);
    }
    if (filtros.comprobante) {
      params = params.append('comprobante', filtros.comprobante);
    }
    if (filtros.fechaInicio) {
      params = params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.append('fechaFin', filtros.fechaFin);
    }

    // Hacemos la petición GET con los parámetros
    return this.http.get<any[]>(this.apiUrl, { params: params });
  }

  public getVentaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
