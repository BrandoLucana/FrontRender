import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Proyecto, ProyectoDTO } from '../models/proyecto.model';
import { Trabajador } from '../models/trabajador.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiUrl}/proyectos`;

  private trabajadoresUrl = `${environment.apiUrl}/trabajadores`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Proyecto[]> {
    return forkJoin({
      proyectos: this.http.get<any[]>(this.apiUrl),
      trabajadores: this.http.get<Trabajador[]>(this.trabajadoresUrl)
    }).pipe(
      map(({ proyectos, trabajadores }) => {
        console.log('🔄 Mapeando trabajadores a proyectos...');
        return proyectos.map(p => {
          if (Array.isArray(p.trabajadores)) {
            return {
              ...p,
              trabajadores: p.trabajadores
            } as Proyecto;
          }

          const trabajadoresIds: number[] = Array.isArray(p.trabajadorIds)
            ? p.trabajadorIds
            : Array.isArray(p.trabajadoresIds)
              ? p.trabajadoresIds
              : p.trabajador_id || p.trabajadorId
                ? [p.trabajador_id || p.trabajadorId]
                : [];

          const trabajadoresAsignados = trabajadores
            .filter(t => trabajadoresIds.includes(t.id));

          return {
            ...p,
            trabajador: trabajadoresAsignados[0] || null,
            trabajadores: trabajadoresAsignados
          } as Proyecto;
        });
      })
    );
  }

  getById(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  create(proyecto: ProyectoDTO): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, proyecto);
  }

  update(id: number, proyecto: ProyectoDTO): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByTrabajador(trabajadorId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/trabajador/${trabajadorId}`);
  }

  getByEstado(estado: string): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/estado/${estado}`);
  }

  updateEstado(id: number, estado: string): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${this.apiUrl}/${id}/estado-proyecto`, { estado });
  }

  toggleStatus(id: number, estadoActual: string): Observable<Proyecto> {
    const endpoint = estadoActual === 'ACTIVO'
      ? `${this.apiUrl}/${id}/desactivar`
      : `${this.apiUrl}/${id}/reactivar`;

    return this.http.patch<any>(endpoint, {}).pipe(
      switchMap(response => {
        console.log('🔵 Respuesta del backend:', response);
        // El backend retorna { message, id, estadoRegistro, proyecto }
        if (response.proyecto) {
          return of(response.proyecto);
        }
        // Si no viene el proyecto, lo obtenemos con GET
        return this.getById(id);
      })
    );
  }
}
