import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProyectoService } from '../../../services/proyecto.service';
import { TrabajadorService } from '../../../services/trabajador.service';
import { Proyecto } from '../../../models/proyecto.model';
import { EstadoProyecto } from '../../../models/enums';
import { Trabajador } from '../../../models/trabajador.model';

@Component({
  selector: 'app-proyectos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './proyectos-list.component.html',
  styleUrls: ['./proyectos-list.component.css']
})
export class ProyectosListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];
  isLoading = true;
  estadosFiltro = Object.values(EstadoProyecto);
  filtroEstado: string = '';
  filtroRegistro: 'TODOS' | 'ACTIVO' | 'INACTIVO' = 'ACTIVO';

  private readonly inactivosStorageKey = 'proyectos_inactivos_cache';

  // Búsquedas
  searchTitulo: string = '';
  searchTrabajador: string = '';
  searchFecha: string = '';

  // Modales
  showToggleConfirm = false;
  showSuccessModal = false;
  proyectoToToggle: Proyecto | null = null;
  successMessage = '';

  showDetailsModal = false;
  selectedProyecto: Proyecto | null = null;
  showAssignModal = false;
  assignProyecto: Proyecto | null = null;
  trabajadoresDisponibles: Trabajador[] = [];
  assignTrabajadorIds: number[] = [];
  assignError = '';
  assignSuccess = '';

  constructor(
    private proyectoService: ProyectoService,
    private trabajadorService: TrabajadorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProyectos();
  }

  loadProyectos(): void {
    this.isLoading = true;
    console.log('📥 Cargando proyectos...');
    this.proyectoService.getAll().subscribe({
      next: (data) => {
        console.log(`✅ ${data.length} proyectos recibidos del backend:`, data);
        // Log para verificar trabajadores
        data.forEach((p, index) => {
          console.log(`Proyecto ${index + 1} (${p.titulo}):`, {
            trabajadores: p.trabajadores?.map(t => t.id),
            trabajadorNombre: p.trabajadores?.map(t => `${t.nombre} ${t.apellido}`).join(', ') || 'Sin asignar'
          });
        });
        this.proyectos = this.mergeWithCachedInactivos(data);
        this.aplicarFiltroRegistro();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar proyectos:', error);
        this.isLoading = false;
      }
    });
  }

  private getCachedInactivos(): Proyecto[] {
    try {
      const raw = localStorage.getItem(this.inactivosStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Proyecto[];
      return Array.isArray(parsed) ? parsed.filter(p => p && p.estadoRegistro === 'INACTIVO') : [];
    } catch {
      return [];
    }
  }

  private setCachedInactivos(proyectos: Proyecto[]): void {
    const soloInactivos = proyectos.filter(p => p && p.estadoRegistro === 'INACTIVO');
    localStorage.setItem(this.inactivosStorageKey, JSON.stringify(soloInactivos));
  }

  private mergeWithCachedInactivos(proyectos: Proyecto[]): Proyecto[] {
    const cached = this.getCachedInactivos();
    const map = new Map<number, Proyecto>();

    proyectos.forEach(p => map.set(p.id, p));
    cached.forEach(p => {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    });

    const merged = Array.from(map.values());
    this.setCachedInactivos(merged);
    return merged;
  }

  private syncCacheForProyecto(proyecto: Proyecto): void {
    const cached = this.getCachedInactivos().filter(p => p.id !== proyecto.id);
    if (proyecto.estadoRegistro === 'INACTIVO') {
      cached.push(proyecto);
    }
    this.setCachedInactivos(cached);
  }

  aplicarFiltroRegistro(): void {
    let proyectosFiltradosTemp = this.proyectos;

    // Filtrar por estado de registro (ACTIVO/INACTIVO)
    if (this.filtroRegistro !== 'TODOS') {
      proyectosFiltradosTemp = proyectosFiltradosTemp.filter(
        p => p.estadoRegistro === this.filtroRegistro
      );
    }

    // Filtrar por estado de proyecto (PENDIENTE/EN_PROGRESO/etc)
    if (this.filtroEstado) {
      proyectosFiltradosTemp = proyectosFiltradosTemp.filter(
        p => p.estado === this.filtroEstado
      );
    }

    // Búsqueda por título
    if (this.searchTitulo) {
      proyectosFiltradosTemp = proyectosFiltradosTemp.filter(
        p => p.titulo.toLowerCase().includes(this.searchTitulo.toLowerCase())
      );
    }

    // Búsqueda por trabajador
    if (this.searchTrabajador) {
      proyectosFiltradosTemp = proyectosFiltradosTemp.filter(p => {
        const trabajadores = p.trabajadores || (p.trabajador ? [p.trabajador] : []);
        const nombres = trabajadores.map(t => `${t.nombre} ${t.apellido} - ${t.cargo}`);
        return nombres.includes(this.searchTrabajador);
      });
    }

    // Búsqueda por fecha de asignación
    if (this.searchFecha) {
      proyectosFiltradosTemp = proyectosFiltradosTemp.filter(
        p => p.fechaAsignacion.includes(this.searchFecha)
      );
    }

    this.proyectosFiltrados = proyectosFiltradosTemp;
    console.log(`🔍 Filtros aplicados - Registro: ${this.filtroRegistro}, Estado: ${this.filtroEstado || 'TODOS'} - Mostrando ${this.proyectosFiltrados.length} de ${this.proyectos.length}`);
  }

  cambiarFiltroRegistro(estado: 'TODOS' | 'ACTIVO' | 'INACTIVO'): void {
    this.filtroRegistro = estado;
    this.aplicarFiltroRegistro();
  }

  onSearchChange(): void {
    this.aplicarFiltroRegistro();
  }

  limpiarBusqueda(): void {
    this.searchTitulo = '';
    this.searchTrabajador = '';
    this.searchFecha = '';
    this.aplicarFiltroRegistro();
  }

  filterByEstado(estado: string): void {
    if (estado === this.filtroEstado) {
      this.filtroEstado = '';
      this.aplicarFiltroRegistro();
    } else {
      this.filtroEstado = estado;
      this.aplicarFiltroRegistro();
    }
  }

  editProyecto(proyecto: Proyecto): void {
    this.router.navigate(['/dashboard/editar-proyecto', proyecto.id]);
  }

  viewDetails(proyecto: Proyecto): void {
    this.selectedProyecto = proyecto;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedProyecto = null;
  }

  openAssignModal(proyecto: Proyecto): void {
    this.assignProyecto = proyecto;
    this.assignTrabajadorIds = proyecto.trabajadores
      ? proyecto.trabajadores.map(t => t.id)
      : proyecto.trabajador
        ? [proyecto.trabajador.id]
        : [];
    this.assignError = '';
    this.assignSuccess = '';

    this.trabajadorService.getAll().subscribe({
      next: (data) => {
        this.trabajadoresDisponibles = data.filter(t => t.estadoRegistro === 'ACTIVO');
        this.showAssignModal = true;
      },
      error: () => {
        this.assignError = 'No se pudo cargar trabajadores.';
        this.showAssignModal = true;
      }
    });
  }

  cancelAssign(): void {
    this.showAssignModal = false;
    this.assignProyecto = null;
    this.assignTrabajadorIds = [];
    this.assignError = '';
    this.assignSuccess = '';
  }

  confirmAssign(): void {
    if (!this.assignProyecto) return;
    if (this.assignTrabajadorIds.length === 0) {
      this.assignError = 'Selecciona al menos un trabajador.';
      return;
    }
    if (this.assignTrabajadorIds.length > 3) {
      this.assignError = 'Máximo 3 trabajadores por proyecto.';
      return;
    }

    const trabajadorIds = [...this.assignTrabajadorIds];

    const payload = {
      titulo: this.assignProyecto.titulo,
      descripcion: this.assignProyecto.descripcion,
      fechaAsignacion: this.assignProyecto.fechaAsignacion,
      fechaLimite: this.assignProyecto.fechaLimite,
      trabajadorIds,
      estado: this.assignProyecto.estado
    };

    this.proyectoService.update(this.assignProyecto.id, payload).subscribe({
      next: () => {
        this.assignSuccess = 'Trabajador asignado correctamente.';
        this.loadProyectos();
        setTimeout(() => this.cancelAssign(), 1200);
      },
      error: () => {
        this.assignError = 'No se pudo asignar el trabajador.';
      }
    });
  }

  toggleAssignTrabajador(id: number): void {
    if (this.assignTrabajadorIds.includes(id)) {
      this.assignTrabajadorIds = this.assignTrabajadorIds.filter(tid => tid !== id);
      return;
    }
    if (this.assignTrabajadorIds.length >= 3) {
      this.assignError = 'Máximo 3 trabajadores por proyecto.';
      return;
    }
    this.assignTrabajadorIds = [...this.assignTrabajadorIds, id];
  }

  isAssignTrabajadorSeleccionado(id: number): boolean {
    return this.assignTrabajadorIds.includes(id);
  }

  confirmToggleStatus(proyecto: Proyecto): void {
    this.proyectoToToggle = proyecto;
    this.showToggleConfirm = true;
  }

  cancelToggle(): void {
    this.showToggleConfirm = false;
    this.proyectoToToggle = null;
  }

  toggleStatus(): void {
    if (!this.proyectoToToggle) return;

    const wasActive = this.proyectoToToggle.estadoRegistro === 'ACTIVO';
    const action = wasActive ? 'desactivado' : 'restaurado';
    const proyectoId = this.proyectoToToggle.id;
    const nuevoEstado = wasActive ? 'INACTIVO' : 'ACTIVO';

    this.proyectoService.toggleStatus(proyectoId, wasActive ? 'ACTIVO' : 'INACTIVO').subscribe({
      next: (proyectoActualizado) => {
        console.log('✅ Proyecto actualizado desde backend:', proyectoActualizado);

        // Actualizar el proyecto en la lista local
        const index = this.proyectos.findIndex(p => p.id === proyectoId);
        if (index !== -1) {
          this.proyectos[index] = proyectoActualizado;
          console.log(`📝 Proyecto ID ${proyectoId} actualizado en lista local. Estado: ${proyectoActualizado.estadoRegistro}`);
        }

        this.syncCacheForProyecto(proyectoActualizado);

        // Cambiar automáticamente al filtro correspondiente
        this.filtroRegistro = nuevoEstado as 'ACTIVO' | 'INACTIVO';
        this.aplicarFiltroRegistro();

        this.successMessage = `Proyecto ${action} exitosamente. Mostrando sección de ${nuevoEstado}s`;
        this.showToggleConfirm = false;
        this.showSuccessModal = true;
        this.proyectoToToggle = null;

        setTimeout(() => {
          this.showSuccessModal = false;
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error changing status:', error);
        this.successMessage = 'Error al cambiar el estado del proyecto';
        this.showToggleConfirm = false;
        this.showSuccessModal = true;
        this.proyectoToToggle = null;

        setTimeout(() => {
          this.showSuccessModal = false;
        }, 3000);
      }
    });
  }

  updateEstado(proyecto: Proyecto, nuevoEstado: string): void {
    this.proyectoService.updateEstado(proyecto.id, nuevoEstado).subscribe({
      next: () => {
        console.log('✅ Estado del proyecto actualizado');
        this.loadProyectos();
      },
      error: (error) => {
        console.error('❌ Error updating estado:', error);
        alert('Error al actualizar el estado');
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'PENDIENTE': 'badge-warning',
      'EN_PROGRESO': 'badge-info',
      'COMPLETADO': 'badge-success',
      'CANCELADO': 'badge-danger'
    };
    return classes[estado] || 'badge-secondary';
  }

  getEstadoRegistroBadgeClass(estado: string): string {
    return estado === 'ACTIVO' ? 'badge-success' : 'badge-inactive';
  }

  getContadorTotal(): number {
    if (this.filtroEstado) {
      return this.proyectos.filter(p => p.estado === this.filtroEstado).length;
    }
    return this.proyectos.length;
  }

  getContadorActivos(): number {
    if (this.filtroEstado) {
      return this.proyectos.filter(p => p.estadoRegistro === 'ACTIVO' && p.estado === this.filtroEstado).length;
    }
    return this.proyectos.filter(p => p.estadoRegistro === 'ACTIVO').length;
  }

  getContadorInactivos(): number {
    if (this.filtroEstado) {
      return this.proyectos.filter(p => p.estadoRegistro === 'INACTIVO' && p.estado === this.filtroEstado).length;
    }
    return this.proyectos.filter(p => p.estadoRegistro === 'INACTIVO').length;
  }

  getTrabajadoresUnicos(): string[] {
    const trabajadoresSet = new Set<string>();
    this.proyectos.forEach(proyecto => {
      const trabajadores = proyecto.trabajadores || (proyecto.trabajador ? [proyecto.trabajador] : []);
      trabajadores.forEach(trabajador => {
        const nombreCompleto = `${trabajador.nombre} ${trabajador.apellido} - ${trabajador.cargo}`;
        trabajadoresSet.add(nombreCompleto);
      });
    });
    return Array.from(trabajadoresSet).sort();
  }
}
