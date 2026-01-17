import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http'; // Asegúrate de que esto esté importado

@Injectable({
  providedIn: 'root'
})
export class Auth { // Tu clase 'Auth'

  //APIWEB
  private apiUrl = 'https://apiventas-1.onrender.com/api/usuarios';
  //APILOCAL-MOBIL
  //apiUrl = 'http://192.168.1.34:8080/api/usuarios';
  //APIPC
  //private apiUrl = 'http://localhost:8080/api/usuarios'; // (O 8081)

  // Inicializa el BehaviorSubject leyendo el estado actual del token
  private loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());

  // Claves para el almacenamiento local
  private readonly AUTH_TOKEN_KEY = 'authToken';
  private readonly USER_ROLE_KEY = 'userRole';
  private readonly USERNAME_KEY = 'username'; // La clave que faltaba

  // Inyectamos HttpClient
  private http = inject(HttpClient);

  constructor() {

  }

  public login(username: string, password: string): Observable<any> {
    const tokenTemp = 'Basic ' + btoa(username + ':' + password);
    const headers = { 'Authorization': tokenTemp };
    return this.http.get<any>(`${this.apiUrl}/me`, { headers }).pipe(
      tap(usuario => {
        localStorage.setItem(this.AUTH_TOKEN_KEY, tokenTemp);
        localStorage.setItem(this.USERNAME_KEY, username);
        localStorage.setItem(this.USER_ROLE_KEY, usuario.rol);
        this.loggedIn.next(true);
      })
    );
  }

  public esAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  public tienePermiso(permiso: string): boolean {
    // Si es Admin, tiene permiso para todo automáticamente
    if (this.esAdmin()) return true;

    // Recuperamos la lista de permisos que guardamos en login.ts
    const permisosGuardados = localStorage.getItem('misPermisos');

    if (permisosGuardados) {
      try {
        // Convertimos el texto JSON a un array real
        const listaPermisos = JSON.parse(permisosGuardados);

        // Verificamos si la lista existe y contiene el permiso
        return Array.isArray(listaPermisos) && listaPermisos.includes(permiso);
      } catch (e) {
        console.error('Error leyendo permisos:', e);
        return false;
      }
    }

    return false;
  }

  public logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem('nombreUsuarioReal');
    localStorage.removeItem('misPermisos');
    this.loggedIn.next(false);
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
