import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  private baseUrl = environment.url;
  private apiUrl = `${this.baseUrl}pdf/download`;

  // Método privado para obtener cabeceras con token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Método privado para manejar errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error al descargar el PDF';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Código: ${error.status}, mensaje: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }


  downloadProductPdf(id: string): Observable<Blob> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/${id}`, {
      headers,
      responseType: 'blob'
    }).pipe(
      tap(response => {
        this.triggerBlobDownload(response, `ficha_tecnica_${id}.pdf`);
      }),
      catchError(error => this.handleError(error))
    );
  }

  storeMailClient(productId: string, email: string): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}pdf/store-email`,
      { productId, email },
      { headers }
    ).pipe(
      catchError(error => this.handleError(error)),
      // Mapea la respuesta para devolver solo el valor booleano de "success"
      map(response => response.success)
    );
  }

  //Método auxiliar para la descarga del archivo en el navegador

  private triggerBlobDownload(blob: Blob, filename: string): void {
    if (isPlatformBrowser(this.platformId)) {
      // Crear una URL para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear un elemento <a> temporal
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Añadir al DOM, hacer clic y eliminar
      document.body.appendChild(link);
      link.click();

      // Limpieza
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      console.error('Descarga de archivos no soportada en SSR');
    }
  }
}
