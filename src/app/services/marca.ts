import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz para la lista de marcas
export interface MarcaDTO {
  idMarca: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class Marca { // Tu clase 'Marca'

  private publicApiUrl = 'http://localhost:8080/api/marcas';
  // --- ¡AÑADE LA URL DE ADMIN! ---
  private adminApiUrl = 'http://localhost:8080/api/admin/marcas';

  private http = inject(HttpClient);
  constructor() { }

  // --- (Método público existente) ---
  public getMarcas(): Observable<MarcaDTO[]> {
    return this.http.get<MarcaDTO[]>(this.publicApiUrl);
  }

  // --- ¡AÑADE ESTOS 4 MÉTODOS CRUD! ---

  public getMarcaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/${id}`);
  }

  public createMarca(data: { nombre: string, descripcion: string }): Observable<any> {
    return this.http.post<any>(this.adminApiUrl, data);
  }

  public updateMarca(id: number, data: { nombre: string, descripcion: string }): Observable<any> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}`, data);
  }

  public deleteMarca(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`);
  }
}
