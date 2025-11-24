import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  idCliente: number;
  nombres: string;
  apellidos: string;
  dni: string;
  celular: string;
  email: string;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = 'http://localhost:8080/api/clientes'; // (O tu puerto)
  private http = inject(HttpClient);

  constructor() { }

  public getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }
}
