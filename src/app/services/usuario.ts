import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Usuario { // Tu CLI usa el nombre 'Usuario'

  private apiUrl = 'http://localhost:8080/api/usuarios'; // O 8081

  constructor(private http: HttpClient) { }

  public getUsuarioPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  public register(userData: any): Observable<any> {
    // Asumimos que esta ruta está abierta para un super-admin o que se usa la ruta /vendedor
    return this.http.post<any>(this.apiUrl, userData);
  }

  public updateUsuario(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
  }
}
