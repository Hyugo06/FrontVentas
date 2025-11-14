import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http'; // Asegúrate de que esto esté importado

@Injectable({
  providedIn: 'root'
})
export class Auth { // Tu clase 'Auth'

  private apiUrl = 'http://localhost:8080/api/usuarios'; // (O 8081)

  // Inicializa el BehaviorSubject leyendo el estado actual del token
  private loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());

  // Claves para el almacenamiento local
  private readonly AUTH_TOKEN_KEY = 'authToken';
  private readonly USER_ROLE_KEY = 'userRole';
  private readonly USERNAME_KEY = 'username'; // La clave que faltaba

  // Inyectamos HttpClient
  private http = inject(HttpClient);

  constructor() {
    // El constructor ahora está casi vacío,
    // porque el BehaviorSubject se inicializa arriba.
    // (Ya no necesitamos this.loggedIn.next(this.isLoggedIn()); aquí)
  }

  /**
   * Guarda el token, llama a /me, y guarda el ROL y el USERNAME
   */
  public login(username: string, password: string): Observable<any> {
    const token = 'Basic ' + btoa(username + ':' + password);
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.USERNAME_KEY, username);

    // ¡ASEGÚRATE DE QUE ESTO SEA UN GET!
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(usuario => {
        localStorage.setItem(this.USER_ROLE_KEY, usuario.rol);
        this.loggedIn.next(true);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.loggedIn.next(false); // <-- Emite el nuevo estado 'false'
  }

  public getAuthToken(): string | null {
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  public getRole(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  public getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }
  // -------------------------------------------

  public isLoggedIn(): boolean {
    return !!this.getAuthToken(); // Devuelve true si el token existe
  }

  public isLoggedIn$(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
  // --- Métodos de API de Usuario ---

  public getUsuarioPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  public updateUsuario(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
  }
  public getAllUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  public deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  public register(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
