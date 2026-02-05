import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Trabajador, TrabajadorDTO } from '../models/trabajador.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrabajadorService {
  private apiUrl = `${environment.apiUrl}/trabajadores`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Trabajador[]> {
    return this.http.get<Trabajador[]>(this.apiUrl);
  }

  getById(id: number): Observable<Trabajador> {
    return this.http.get<Trabajador>(`${this.apiUrl}/${id}`);
  }

  create(trabajador: TrabajadorDTO): Observable<Trabajador> {
    return this.http.post<Trabajador>(this.apiUrl, trabajador);
  }

  update(id: number, trabajador: TrabajadorDTO): Observable<Trabajador> {
    return this.http.put<Trabajador>(`${this.apiUrl}/${id}`, trabajador);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number, estadoActual: string): Observable<Trabajador> {
    const endpoint = estadoActual === 'ACTIVO'
      ? `${this.apiUrl}/${id}/desactivar`
      : `${this.apiUrl}/${id}/reactivar`;

    return this.http.patch<any>(endpoint, {}).pipe(
      switchMap(response => {
        console.log('🔵 Respuesta del backend:', response);
        // El backend retorna { message, id, estado, trabajador }
        if (response.trabajador) {
          return of(response.trabajador);
        }
        // Si no viene el trabajador, lo obtenemos con GET
        return this.getById(id);
      })
    );
  }
}
