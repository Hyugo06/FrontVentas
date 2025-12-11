import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Usuario { // Tu CLI usa el nombre 'Usuario'

  private apiUrl = 'http://192.168.1.34:8080/api/usuarios';
  //private apiUrl = 'http://localhost:8080/api/usuarios';
  //private apiUrl = 'https://apiventas-1.onrender.com/api/usuarios';

  constructor(private http: HttpClient) { }

  public getUsuarioPorId(id: string): Observable<Usuario> { // <--- Usa el tipo Usuario
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  public register(userData: any): Observable<any> {
    // Asumimos que esta ruta está abierta para un super-admin o que se usa la ruta /vendedor
    return this.http.post<any>(this.apiUrl, userData);
  }

  public updateUsuario(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
  }
}
