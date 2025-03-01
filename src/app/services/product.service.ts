import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Product, ProductResponse, ProductsResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cookieService = inject(CookieService);
  private authService = inject(AuthService);

  private baseUrl = environment.url;
  private apiUrl = `${this.baseUrl}products`;

  // Signals para estado de los productos
  readonly isLoading = signal<boolean>(false);
  readonly products = signal<Product[]>([]);
  readonly productsUser = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  readonly totalProducts = signal<number>(0);
  readonly error = signal<string | null>(null);

  // Método privado para obtener cabeceras con token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Método privado para manejar errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Código: ${error.status}, mensaje: ${error.message}`;
    }

    this.error.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Obtener todos los productos
  getProducts(): Observable<Product[]> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.get<ProductsResponse>(this.apiUrl, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            this.products.set(response.data);
            if (response.total) {
              this.totalProducts.set(response.total);
            }
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.handleError(error);
          return of([]);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Obtener todos los productos de un usuario
  getProductsUser(): Observable<Product[]> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.get<ProductsResponse>(`${this.apiUrl}/prods/user`, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            this.productsUser.set(response.data);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.handleError(error);
          return of([]);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<Product | null> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            this.selectedProduct.set(response.data);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.handleError(error);
          return of(null);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Crear un nuevo producto
  createProduct(product: Product): Observable<Product | null> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.post<ProductResponse>(this.apiUrl, product, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            // Actualizar la lista de productos añadiendo el nuevo
            const currentProducts = this.products();
            this.products.set([...currentProducts, response.data]);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.handleError(error);
          return of(null);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Actualizar un producto existente
  updateProduct(id: string, product: Partial<Product>): Observable<Product | null> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, product, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            // Actualizar el producto en la lista
            const currentProducts = this.products();
            const updatedProducts = currentProducts.map(p =>
              p._id === id ? { ...p, ...response.data } : p
            );
            this.products.set(updatedProducts);

            // Actualizar el producto seleccionado si es el mismo
            const currentSelected = this.selectedProduct();
            if (currentSelected && currentSelected._id === id) {
              this.selectedProduct.set(response.data);
            }
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.handleError(error);
          return of(null);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    const headers = this.getAuthHeaders();

    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            // Eliminar el producto de la lista
            const currentProducts = this.products();
            this.products.set(currentProducts.filter(p => p._id !== id));
          }
        }),
        map(response => response.success),
        catchError(error => {
          this.handleError(error);
          return of(false);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  // Limpiar la selección actual
  clearSelectedProduct(): void {
    this.selectedProduct.set(null);
  }

  // Limpiar errores
  clearError(): void {
    this.error.set(null);
  }
}
