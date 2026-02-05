import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TrabajadorService } from '../../../services/trabajador.service';
import { ProyectoService } from '../../../services/proyecto.service';
import { Trabajador } from '../../../models/trabajador.model';
import { Proyecto } from '../../../models/proyecto.model';

@Component({
  selector: 'app-trabajadores-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './trabajadores-list.component.html',
  styleUrls: ['./trabajadores-list.component.css']
})
export class TrabajadoresListComponent implements OnInit {
  trabajadores: Trabajador[] = [];
  trabajadoresFiltrados: Trabajador[] = [];
  selectedTrabajador: Trabajador | null = null;
  proyectosTrabajador: Proyecto[] = [];
  isLoading = true;
  showProyectos = false;
  filtroEstado: 'TODOS' | 'ACTIVO' | 'INACTIVO' = 'ACTIVO';

  showAssignModal = false;
  assignTrabajador: Trabajador | null = null;
  assignProyectoId: number | null = null;
  assignProyectosDisponibles: Proyecto[] = [];
  assignError = '';
  assignSuccess = '';
  private assignProyectosActuales: Proyecto[] = [];
  assignProyectoSeleccionado: Proyecto | null = null;

  private readonly inactivosStorageKey = 'trabajadores_inactivos_cache';

  // Búsquedas
  searchNombre: string = '';
  searchFecha: string = '';

  // Modales
  showToggleConfirm = false;
  showSuccessModal = false;
  trabajadorToToggle: Trabajador | null = null;
  successMessage = '';

  constructor(
    private trabajadorService: TrabajadorService,
    private proyectoService: ProyectoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTrabajadores();
  }

  loadTrabajadores(): void {
    this.isLoading = true;
    console.log('📥 Cargando lista de trabajadores...');

    this.trabajadorService.getAll().subscribe({
      next: (data) => {
        this.trabajadores = this.mergeWithCachedInactivos(data);
        this.aplicarFiltro();
        this.isLoading = false;
        console.log(`✅ ${data.length} trabajadores cargados (${this.trabajadoresFiltrados.length} visibles)`);
      },
      error: (error) => {
        console.error('❌ Error al cargar trabajadores:', error);
        this.isLoading = false;

        // Mensaje específico según el error
        if (error.status === 403) {
          console.error('🔴 ERROR 403: El backend rechaza tu token JWT');
          console.error('💡 Verifica la configuración de Spring Security en el backend');
          console.error('   - JwtAuthenticationFilter debe validar el token correctamente');
          console.error('   - La clave secreta JWT debe coincidir');
          alert('❌ Error 403: Tu sesión no tiene permisos. Problema de configuración en el backend.\n\nVerifica que Spring Security esté configurado correctamente para validar tokens JWT.');
        } else if (error.status === 401) {
          alert('❌ Tu sesión ha expirado. Redirigiendo al login...');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else if (error.status === 0) {
          alert('❌ No se puede conectar al servidor.\n\nVerifica que el backend esté corriendo en http://localhost:8080');
        }
      }
    });
  }

  private getCachedInactivos(): Trabajador[] {
    try {
      const raw = localStorage.getItem(this.inactivosStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Trabajador[];
      return Array.isArray(parsed) ? parsed.filter(t => t && t.estadoRegistro === 'INACTIVO') : [];
    } catch {
      return [];
    }
  }

  private setCachedInactivos(trabajadores: Trabajador[]): void {
    const soloInactivos = trabajadores.filter(t => t && t.estadoRegistro === 'INACTIVO');
    localStorage.setItem(this.inactivosStorageKey, JSON.stringify(soloInactivos));
  }

  private mergeWithCachedInactivos(trabajadores: Trabajador[]): Trabajador[] {
    const cached = this.getCachedInactivos();
    const map = new Map<number, Trabajador>();

    trabajadores.forEach(t => map.set(t.id, t));
    cached.forEach(t => {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      }
    });

    const merged = Array.from(map.values());
    this.setCachedInactivos(merged);
    return merged;
  }

  private syncCacheForTrabajador(trabajador: Trabajador): void {
    const cached = this.getCachedInactivos().filter(t => t.id !== trabajador.id);
    if (trabajador.estadoRegistro === 'INACTIVO') {
      cached.push(trabajador);
    }
    this.setCachedInactivos(cached);
  }

  viewDetails(trabajador: Trabajador): void {
    this.selectedTrabajador = trabajador;
    this.showProyectos = true;
    this.loadProyectosTrabajador(trabajador.id);
  }

  loadProyectosTrabajador(trabajadorId: number): void {
    this.proyectoService.getByTrabajador(trabajadorId).subscribe({
      next: (data) => {
        this.proyectosTrabajador = data;
      },
      error: (error) => {
        console.error('Error loading proyectos:', error);
      }
    });
  }

  closeDetails(): void {
    this.showProyectos = false;
    this.selectedTrabajador = null;
    this.proyectosTrabajador = [];
  }

  editTrabajador(trabajador: Trabajador): void {
    this.router.navigate(['/dashboard/editar-trabajador', trabajador.id]);
  }

  editProyecto(proyecto: Proyecto): void {
    this.router.navigate(['/dashboard/editar-proyecto', proyecto.id]);
  }

  confirmToggleStatus(trabajador: Trabajador): void {
    this.trabajadorToToggle = trabajador;
    this.showToggleConfirm = true;
  }

  cancelToggle(): void {
    this.showToggleConfirm = false;
    this.trabajadorToToggle = null;
  }

  toggleStatus(): void {
    if (!this.trabajadorToToggle) return;

    const wasActive = this.trabajadorToToggle.estadoRegistro === 'ACTIVO';
    const action = wasActive ? 'desactivado' : 'restaurado';
    const trabajadorId = this.trabajadorToToggle.id;
    const nuevoEstado = wasActive ? 'INACTIVO' : 'ACTIVO';

    this.trabajadorService.toggleStatus(trabajadorId, wasActive ? 'ACTIVO' : 'INACTIVO').subscribe({
      next: (trabajadorActualizado) => {
        console.log('✅ Trabajador actualizado desde backend:', trabajadorActualizado);

        // Actualizar el trabajador en la lista local
        const index = this.trabajadores.findIndex(t => t.id === trabajadorId);
        if (index !== -1) {
          this.trabajadores[index] = trabajadorActualizado;
          console.log(`📝 Trabajador ID ${trabajadorId} actualizado en lista local. Estado: ${trabajadorActualizado.estadoRegistro}`);
        }

        this.syncCacheForTrabajador(trabajadorActualizado);

        // Cambiar automáticamente al filtro correspondiente
        this.filtroEstado = nuevoEstado as 'ACTIVO' | 'INACTIVO';
        this.aplicarFiltro();

        if (this.selectedTrabajador?.id === this.trabajadorToToggle?.id) {
          this.closeDetails();
        }

        this.successMessage = `Trabajador ${action} exitosamente. Mostrando sección de ${nuevoEstado}s`;
        this.showToggleConfirm = false;
        this.showSuccessModal = true;
        this.trabajadorToToggle = null;

        setTimeout(() => {
          this.showSuccessModal = false;
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error changing status:', error);
        this.successMessage = 'Error al cambiar el estado del trabajador';
        this.showToggleConfirm = false;
        this.showSuccessModal = true;
        this.trabajadorToToggle = null;

        setTimeout(() => {
          this.showSuccessModal = false;
        }, 3000);
      }
    });
  }

  asignarProyecto(trabajador: Trabajador): void {
    this.openAssignModal(trabajador);
  }

  openAssignModal(trabajador: Trabajador): void {
    this.assignError = '';
    this.assignSuccess = '';
    this.assignTrabajador = trabajador;
    this.assignProyectoId = null;
    this.assignProyectosDisponibles = [];

    this.proyectoService.getByTrabajador(trabajador.id).subscribe({
      next: (data) => {
        this.assignProyectosActuales = data;
        const activos = data.filter(p => p.estadoRegistro === 'ACTIVO').length;
        if (activos >= 3) {
          this.assignError = 'El trabajador ya tiene 3 proyectos activos (máximo permitido).';
          this.showAssignModal = true;
          return;
        }

        this.proyectoService.getAll().subscribe({
          next: (proyectos) => {
            this.assignProyectosDisponibles = proyectos
              .filter(p => !p.estadoRegistro || p.estadoRegistro === 'ACTIVO')
              .sort((a, b) => a.titulo.localeCompare(b.titulo));
            if (this.assignProyectosDisponibles.length === 0) {
              this.assignError = 'No hay proyectos disponibles para asignar.';
            }
            const idsActuales = new Set(this.assignProyectosActuales.map(p => p.id));
            const preseleccionado = this.assignProyectosDisponibles.find(p => idsActuales.has(p.id));
            if (preseleccionado) {
              this.assignProyectoId = preseleccionado.id;
              this.assignProyectoSeleccionado = preseleccionado;
            } else {
              this.assignProyectoSeleccionado = null;
            }
            this.showAssignModal = true;
          },
          error: () => {
            this.assignError = 'No se pudo cargar proyectos disponibles.';
            this.showAssignModal = true;
          }
        });
      },
      error: () => {
        this.assignProyectosActuales = [];
        this.assignError = 'No se pudo verificar los proyectos del trabajador.';
        this.showAssignModal = true;
      }
    });
  }

  cancelAssign(): void {
    this.showAssignModal = false;
    this.assignTrabajador = null;
    this.assignError = '';
    this.assignSuccess = '';
    this.assignProyectosActuales = [];
    this.assignProyectosDisponibles = [];
    this.assignProyectoId = null;
    this.assignProyectoSeleccionado = null;
  }

  confirmAssign(): void {
    if (!this.assignTrabajador) return;

    this.assignError = '';
    if (!this.assignProyectoId) {
      this.assignError = 'Selecciona un proyecto disponible.';
      return;
    }

    const proyecto = this.assignProyectosDisponibles.find(p => p.id === this.assignProyectoId);
    if (!proyecto) {
      this.assignError = 'Proyecto inválido.';
      return;
    }

    this.assignProyectoSeleccionado = proyecto;

    const trabajadoresActuales = proyecto.trabajadores
      ? proyecto.trabajadores.map(t => t.id)
      : proyecto.trabajador
        ? [proyecto.trabajador.id]
        : [];

    if (!trabajadoresActuales.includes(this.assignTrabajador.id) && trabajadoresActuales.length >= 3) {
      this.assignError = 'Este proyecto ya tiene 3 trabajadores asignados (máximo permitido).';
      return;
    }

    const trabajadorIds = Array.from(new Set([...trabajadoresActuales, this.assignTrabajador.id]));

    const payload = {
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      fechaAsignacion: proyecto.fechaAsignacion,
      fechaLimite: proyecto.fechaLimite,
      trabajadorIds,
      estado: proyecto.estado
    };

    this.proyectoService.update(proyecto.id, payload).subscribe({
      next: () => {
        this.assignSuccess = 'Proyecto asignado correctamente.';
        this.loadProyectosTrabajador(this.assignTrabajador!.id);
        this.loadTrabajadores();
        setTimeout(() => this.cancelAssign(), 1200);
      },
      error: () => {
        this.assignError = 'No se pudo asignar el proyecto.';
      }
    });
  }

  onAssignProyectoChange(): void {
    if (!this.assignProyectoId) {
      this.assignProyectoSeleccionado = null;
      return;
    }
    this.assignProyectoSeleccionado = this.assignProyectosDisponibles.find(p => p.id === this.assignProyectoId) || null;
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'ACTIVO' ? 'badge-success' : 'badge-inactive';
  }

  getEstadoProyectoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'PENDIENTE': 'badge-warning',
      'EN_PROGRESO': 'badge-info',
      'COMPLETADO': 'badge-success',
      'CANCELADO': 'badge-danger'
    };
    return classes[estado] || 'badge-secondary';
  }

  aplicarFiltro(): void {
    let trabajadoresFiltradosTemp = this.trabajadores;

    // Filtrar por estado de registro
    if (this.filtroEstado !== 'TODOS') {
      trabajadoresFiltradosTemp = trabajadoresFiltradosTemp.filter(
        t => t.estadoRegistro === this.filtroEstado
      );
    }

    // Búsqueda por nombre o apellido
    if (this.searchNombre) {
      trabajadoresFiltradosTemp = trabajadoresFiltradosTemp.filter(t => {
        const nombreCompleto = `${t.nombre} ${t.apellido}`.toLowerCase();
        return nombreCompleto.includes(this.searchNombre.toLowerCase());
      });
    }

    // Búsqueda por fecha de ingreso
    if (this.searchFecha) {
      trabajadoresFiltradosTemp = trabajadoresFiltradosTemp.filter(
        t => t.fechaIngreso.includes(this.searchFecha)
      );
    }

    this.trabajadoresFiltrados = trabajadoresFiltradosTemp;
    console.log(`🔍 Filtro aplicado: ${this.filtroEstado} - Mostrando ${this.trabajadoresFiltrados.length} de ${this.trabajadores.length}`);
  }

  cambiarFiltro(estado: 'TODOS' | 'ACTIVO' | 'INACTIVO'): void {
    this.filtroEstado = estado;
    this.aplicarFiltro();
  }

  onSearchChange(): void {
    this.aplicarFiltro();
  }

  limpiarBusqueda(): void {
    this.searchNombre = '';
    this.searchFecha = '';
    this.aplicarFiltro();
  }


  getContadorTotal(): number {
    return this.trabajadores.length;
  }

  getContadorActivos(): number {
    return this.trabajadores.filter(t => t.estadoRegistro === 'ACTIVO').length;
  }

  getContadorInactivos(): number {
    return this.trabajadores.filter(t => t.estadoRegistro === 'INACTIVO').length;
  }
}
