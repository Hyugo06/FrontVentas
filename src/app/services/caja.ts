import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Caja {

  // Ajusta la URL si es necesario (igual que en tus otros servicios)
  private apiUrl = `${environment.apiUrl}/api/caja`;
  // private apiUrl = 'http://localhost:8080/api/caja';

  constructor(private http: HttpClient) { }

  // 1. Consultar estado (¿Tengo caja abierta?)
  obtenerEstado(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estado`);
  }

  // 2. Abrir caja
  abrirCaja(montoInicial: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/abrir`, { montoInicial });
  }

  // 3. Cerrar caja (Arqueo)
  cerrarCaja(montoReal: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cerrar`, { montoReal });
  }
}
