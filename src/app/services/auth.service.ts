import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cookieService = inject(CookieService);

  private baseUrl = environment.url;
  private tokenKey = 'auth_token';
  private isLoadingUser = false;

  // Signals para estado de autenticación y usuario
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly tokenLoaded = signal<boolean>(false);

  constructor() {
    // Inicializar estado de autenticación al cargar
    this.checkAuth();
  }

  // Método público para verificar si está autenticado
  checkAuth(): boolean {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
      this.tokenLoaded.set(true);
      return false;
    }

    try {
      // Decodificar y verificar el token
      const decoded = jwtDecode(token) as DecodedToken;
      const isValid = decoded.exp * 1000 > Date.now();

      if (!isValid) {
        this.logout();
        this.tokenLoaded.set(true);
        return false;
      }

      // Extraer información básica del usuario desde el token
      const basicUser: User = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username
      };

      // Establecer usuario básico desde el token inmediatamente
      this.currentUser.set(basicUser);
      this.isAuthenticated.set(true);
      this.tokenLoaded.set(true);

      return true;
    } catch (error) {
      this.logout();
      this.tokenLoaded.set(true);
      return false;
    }
  }

  // Login con email y password
  login(email: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${this.baseUrl}auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setToken(response.token);
            this.currentUser.set(response.user);
            this.isAuthenticated.set(true);
            this.tokenLoaded.set(true);
          }
        }),
        map(response => response.user),
        catchError(error => {
          this.tokenLoaded.set(true);
          return throwError(() => new Error(error.error.message || 'Error al iniciar sesión'));
        })
      );
  }

  // registro con username, email y password
  register(username: string, email: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${this.baseUrl}auth/register`, { username, email, password })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setToken(response.token);
            this.currentUser.set(response.user);
            this.isAuthenticated.set(true);
            this.tokenLoaded.set(true);
          }
        }),
        map(response => response.user),
        catchError(error => {
          this.tokenLoaded.set(true);
          return throwError(() => new Error(error.error.message || 'Error al registrar usuario'));
        })
      );
  }

  // Método público para obtener los datos actualizados del usuario
  refreshUser(): Observable<User | null> {
    const token = this.getToken();
    if (!token) return of(null);

    this.isLoadingUser = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<User>(`${this.baseUrl}auth/me`, { headers })
      .pipe(
        tap(user => {
          this.currentUser.set(user);
        }),
        catchError(error => {
          if (error.status === 401) {
            this.logout();
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoadingUser = false;
        })
      );
  }

  // Cerrar sesión
  logout(): void {
    this.removeToken();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  // Obtener el token para uso en peticiones HTTP
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.cookieService.get(this.tokenKey) || null;
    }
    return null;
  }

  // Método para crear un HttpHeaders con el token de autenticación
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : new HttpHeaders();
  }

  // Método utilitario para hacer peticiones autenticadas
  authRequest<T>(method: string, url: string, body?: any): Observable<T> {
    const headers = this.getAuthHeaders();
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    let request: Observable<T>;
    switch (method.toLowerCase()) {
      case 'get':
        request = this.http.get<T>(fullUrl, { headers });
        break;
      case 'post':
        request = this.http.post<T>(fullUrl, body, { headers });
        break;
      case 'put':
        request = this.http.put<T>(fullUrl, body, { headers });
        break;
      case 'delete':
        request = this.http.delete<T>(fullUrl, { headers });
        break;
      default:
        return throwError(() => new Error('Método HTTP no soportado'));
    }

    return request.pipe(
      catchError(error => {
        // Si hay error 401, limpiar la autenticación
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  // Métodos privados para gestión de token
  private setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const secure = window.location.protocol === 'https:';
      const expires = new Date();

      try {
        const decoded = jwtDecode(token) as DecodedToken;
        expires.setTime(decoded.exp * 1000);
      } catch {
        // Token con 1 año de duración si no se puede decodificar
        expires.setTime(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }

      this.cookieService.set(
        this.tokenKey,
        token,
        expires,
        '/',
        '',
        secure,
        'Strict'
      );
    }
  }

  private removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.delete(this.tokenKey, '/');
    }
  }
}

// No olvides importar finalize
import { finalize } from 'rxjs/operators';
import { DecodedToken, LoginResponse, User } from '../interfaces';
