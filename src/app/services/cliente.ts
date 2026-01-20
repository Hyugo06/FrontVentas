import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz Cliente
export interface Cliente {
  idCliente: number;
  nombres: string;
  apellidos: string;
  dni: string;
  celular?: string;
  email?: string;
  direccion?: string;
  fechaRegistro?: string;
  deudaActual?: number; // Este dato ahora viene calculado del Backend
}



export interface Movimiento {
  idMovimiento?: number;
  tipo: 'DEUDA' | 'PAGO';
  monto: number;
  fecha: string;          // <--- CAMBIO AQUÍ: Quítale el '?' (antes era fecha?: string)
  comentario?: string;
  comprobante?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  // Asegúrate de que esta URL coincida con tu backend
  private apiUrl = 'https://apiventas-1.onrender.com/api/clientes';

  private http = inject(HttpClient);

  constructor() { }

  // --- CLIENTES ---

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getClientePorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createCliente(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateCliente(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // --- CUENTA CORRIENTE (CONEXIÓN REAL) ---

  // 1. Obtener historial real desde la BD
  getHistorialCliente(idCliente: number): Observable<Movimiento[]> {
    // Llama al endpoint Java: GET /api/clientes/{id}/movimientos
    return this.http.get<Movimiento[]>(`${this.apiUrl}/${idCliente}/movimientos`);
  }

  // 2. Guardar movimiento real en la BD
  registrarMovimiento(idCliente: number, movimiento: { tipo: string, monto: number, comentario: string, comprobante?: string }): Observable<any> {
    // Llama al endpoint Java: POST /api/clientes/{id}/movimientos
    return this.http.post<any>(`${this.apiUrl}/${idCliente}/movimientos`, movimiento);
  }
}
