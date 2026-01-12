import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cupon } from '../model/cupon';

@Injectable({
  providedIn: 'root'
})
export class CuponService {

  // Ajusta la URL si es necesario (ej. localhost o render)
  // private apiUrl = 'http://192.168.1.34:8080/api/cupones';
  private apiUrl = 'https://apiventas-1.onrender.com/api/clientes';

  private http = inject(HttpClient);

  // Crear nuevo cupón (ADMIN)
  crearCupon(cupon: Cupon): Observable<Cupon> {
    return this.http.post<Cupon>(this.apiUrl, cupon);
  }

  // Validar cupón (CLIENTE - lo usaremos luego)
  validarCupon(codigo: string, monto: number): Observable<Cupon> {
    return this.http.post<Cupon>(`${this.apiUrl}/validar`, { codigo, monto });
  }

  // Listar todos (Opcional, para que veas los que has creado)
  obtenerTodos(): Observable<Cupon[]> {
    return this.http.get<Cupon[]>(this.apiUrl);
  }

  // Obtener un cupón específico (para editar)
  obtenerPorId(id: number): Observable<Cupon> {
    return this.http.get<Cupon>(`${this.apiUrl}/${id}`);
  }

  // Actualizar
  actualizar(id: number, cupon: Cupon): Observable<Cupon> {
    return this.http.put<Cupon>(`${this.apiUrl}/${id}`, cupon);
  }

  // Eliminar
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
