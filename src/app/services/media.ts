import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Media {

  private apiUrl = 'http://localhost:8080/api/media/upload'; // (O tu puerto 8081)
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Sube un archivo al servidor y devuelve la URL pública.
   */
  public uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file); // 'file' debe coincidir con el @RequestParam del backend

    return this.http.post<{ url: string }>(this.apiUrl, formData);
  }
}
