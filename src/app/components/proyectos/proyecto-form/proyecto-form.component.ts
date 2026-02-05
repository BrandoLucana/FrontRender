import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProyectoService } from '../../../services/proyecto.service';
import { TrabajadorService } from '../../../services/trabajador.service';
import { ProyectoDTO, Proyecto } from '../../../models/proyecto.model';
import { Trabajador } from '../../../models/trabajador.model';
import { EstadoProyecto } from '../../../models/enums';

@Component({
  selector: 'app-proyecto-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormComponent implements OnInit {
  proyectoId: number | null = null;
  isEdit = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showConfirmModal = false;
  private confirmEditPending = false;
  trabajadores: Trabajador[] = [];
  estadoProyecto = Object.values(EstadoProyecto);
  trabajadorNombre = '';
  selectedTrabajadoresIds: number[] = [];
  showTrabajadoresDropdown = false;
  proyectosExistentes: Proyecto[] = [];
  private trabajadoresAsignadosCache: Trabajador[] = [];

  proyecto: ProyectoDTO = {
    titulo: '',
    descripcion: '',
    fechaAsignacion: this.getCurrentDate(),
    fechaLimite: '',
    trabajadorIds: []
  };

  constructor(
    private proyectoService: ProyectoService,
    private trabajadorService: TrabajadorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTrabajadores();
    this.loadProyectosExistentes();

    // Verificar si viene un trabajadorId desde query params
    this.route.queryParams.subscribe(params => {
      if (params['trabajadorId']) {
        const trabajadorId = Number(params['trabajadorId']);
        this.selectedTrabajadoresIds = [trabajadorId];
        this.proyecto.trabajadorIds = [trabajadorId];
        console.log('✅ TrabajadorId desde query params:', trabajadorId);
      }
    });

    this.proyectoId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.proyectoId) {
      this.isEdit = true;
      this.loadProyecto();
    }
  }

  loadProyectosExistentes(): void {
    this.proyectoService.getAll().subscribe({
      next: (data) => {
        this.proyectosExistentes = data;
      },
      error: () => {
        this.proyectosExistentes = [];
      }
    });
  }

  loadTrabajadores(): void {
    this.trabajadorService.getAll().subscribe({
      next: (data) => {
        this.trabajadores = data.filter(t => t.estadoRegistro === 'ACTIVO');
        this.mergeTrabajadoresAsignados(this.trabajadoresAsignadosCache);
        console.log(`✅ ${this.trabajadores.length} trabajadores activos cargados:`, this.trabajadores);
      },
      error: (error) => {
        console.error('❌ Error loading trabajadores:', error);
      }
    });
  }

  loadProyecto(): void {
    if (this.proyectoId) {
      this.proyectoService.getById(this.proyectoId).subscribe({
        next: (data: Proyecto) => {
          const trabajadoresIds = Array.isArray(data.trabajadores)
            ? data.trabajadores.map(t => t.id)
            : data.trabajador
              ? [data.trabajador.id]
              : [];

          this.trabajadoresAsignadosCache = Array.isArray(data.trabajadores)
            ? data.trabajadores
            : data.trabajador
              ? [data.trabajador]
              : [];

          this.proyecto = {
            titulo: data.titulo,
            descripcion: data.descripcion,
            fechaAsignacion: data.fechaAsignacion,
            fechaLimite: data.fechaLimite,
            trabajadorIds: trabajadoresIds,
            estado: data.estado
          };
          this.selectedTrabajadoresIds = trabajadoresIds;
          this.mergeTrabajadoresAsignados(this.trabajadoresAsignadosCache);
          // Setear el nombre del trabajador para el input
          if (data.trabajador) {
            this.trabajadorNombre = `${data.trabajador.nombre} ${data.trabajador.apellido} - ${data.trabajador.cargo}`;
          }
        },
        error: (error) => {
          console.error('Error loading proyecto:', error);
          this.errorMessage = 'Error al cargar el proyecto';
        }
      });
    }
  }

  toggleTrabajadoresDropdown(): void {
    this.showTrabajadoresDropdown = !this.showTrabajadoresDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showTrabajadoresDropdown) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target || !target.closest('.select-room')) {
      this.showTrabajadoresDropdown = false;
    }
  }

  isTrabajadorSeleccionado(id: number): boolean {
    return this.selectedTrabajadoresIds.includes(id);
  }

  toggleTrabajador(id: number): void {
    if (this.isTrabajadorSeleccionado(id)) {
      this.selectedTrabajadoresIds = this.selectedTrabajadoresIds.filter(tid => tid !== id);
    } else {
      if (this.selectedTrabajadoresIds.length >= 3) {
        this.errorMessage = 'Solo puedes seleccionar hasta 3 trabajadores';
        return;
      }
      this.selectedTrabajadoresIds = [...this.selectedTrabajadoresIds, id];
    }
    this.proyecto.trabajadorIds = [...this.selectedTrabajadoresIds];
  }

  private mergeTrabajadoresAsignados(asignados: Trabajador[]): void {
    if (!asignados || asignados.length === 0) {
      return;
    }
    const existentes = new Set(this.trabajadores.map(t => t.id));
    const extras = asignados.filter(t => !existentes.has(t.id));
    if (extras.length > 0) {
      this.trabajadores = [...this.trabajadores, ...extras];
    }
  }

  getTrabajadoresSeleccionadosLabel(): string {
    if (this.selectedTrabajadoresIds.length === 0) {
      return 'Seleccione hasta 3 trabajadores...';
    }
    const nombres = this.trabajadores
      .filter(t => this.selectedTrabajadoresIds.includes(t.id))
      .map(t => `${t.nombre} ${t.apellido}`);
    return nombres.join(', ');
  }

  onSubmit(): void {
    if (this.isEdit && !this.confirmEditPending) {
      this.showConfirmModal = true;
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const operation = this.isEdit && this.proyectoId
      ? this.proyectoService.update(this.proyectoId, this.proyecto)
      : this.proyectoService.create(this.proyecto);

    operation.subscribe({
      next: () => {
        this.isLoading = false;
        this.confirmEditPending = false;
        this.successMessage = this.isEdit
          ? 'Proyecto actualizado exitosamente'
          : 'Proyecto creado exitosamente';

        setTimeout(() => {
          this.router.navigate(['/dashboard/proyectos']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.confirmEditPending = false;
        console.error('Error saving proyecto:', error);
        if (error.status === 0) {
          this.errorMessage = '🔴 ERROR DE CONEXIÓN: No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (error.status === 401) {
          this.errorMessage = '🔴 ERROR 401 NO AUTORIZADO: Tu sesión expiró. Por favor vuelve a iniciar sesión';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 403) {
          this.errorMessage = '🔴 ERROR 403 PROHIBIDO: No tienes permisos para crear/editar proyectos. Verifica los roles en el backend y reinicia el servidor.';
        } else if (error.status === 404) {
          this.errorMessage = '🔴 ERROR 404: Endpoint no encontrado. Verifica que el backend tenga el controlador /api/proyectos';
        } else if (error.status === 500) {
          this.errorMessage = '🔴 ERROR 500: Error interno del servidor. Revisa los logs del backend';
          if (error.error?.message) {
            this.errorMessage += ` - ${error.error.message}`;
          }
        } else {
          this.errorMessage = `🔴 ERROR ${error.status}: ${error.error?.message || 'Error al guardar el proyecto'}`;
        }
      }
    });
  }

  confirmEdit(): void {
    this.showConfirmModal = false;
    this.confirmEditPending = true;
    this.onSubmit();
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.confirmEditPending = false;
  }

  validateForm(): boolean {
    const tituloOriginal = this.proyecto.titulo ?? '';
    const descripcionOriginal = this.proyecto.descripcion ?? '';

    this.proyecto.titulo = this.normalizeTextFinal(tituloOriginal);
    this.proyecto.descripcion = descripcionOriginal.trim();

    if (!this.proyecto.titulo || this.proyecto.titulo === '') {
      this.errorMessage = 'El título es obligatorio';
      return false;
    }
    if (!this.proyecto.descripcion || this.proyecto.descripcion === '') {
      this.errorMessage = 'La descripción es obligatoria';
      return false;
    }
    if (!this.proyecto.fechaAsignacion) {
      this.errorMessage = 'La fecha de asignación es obligatoria';
      return false;
    }
    if (!this.proyecto.fechaLimite) {
      this.errorMessage = 'La fecha límite es obligatoria';
      return false;
    }

    // Validar que la fecha de asignación no sea anterior a hoy (solo en creación)
    const fechaAsignacion = this.parseDateDMY(this.proyecto.fechaAsignacion);
    if (!this.isEdit) {
      const hoy = this.parseDateDMY(this.getCurrentDate());
      if (fechaAsignacion < hoy) {
        this.errorMessage = 'La fecha de asignación no puede ser anterior a la fecha actual';
        return false;
      }
    }

    // Validar que la fecha límite no sea anterior a la fecha de asignación
    const fechaLimite = this.parseDateDMY(this.proyecto.fechaLimite);
    if (fechaLimite < fechaAsignacion) {
      this.errorMessage = 'La fecha límite no puede ser anterior a la fecha de asignación';
      return false;
    }

    if (!this.proyecto.trabajadorIds || this.proyecto.trabajadorIds.length === 0) {
      this.errorMessage = 'Debe seleccionar al menos un trabajador';
      return false;
    }

    if (this.proyecto.trabajadorIds.length > 3) {
      this.errorMessage = 'Solo puedes seleccionar hasta 3 trabajadores';
      return false;
    }

    if (this.isDuplicateProyecto()) {
      this.errorMessage = 'Ya existe un proyecto con el mismo título y trabajador';
      return false;
    }

    return true;
  }

  parseDateDMY(dateStr: string): Date {
    const parts = dateStr.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  getCurrentDate(): string {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  normalizeTextFinal(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  normalizeTextForInput(value: string): string {
    return value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  }

  onTituloInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeTextForInput(input.value);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    this.proyecto.titulo = normalized;
  }

  private isDuplicateProyecto(): boolean {
    const titulo = this.proyecto.titulo.toLowerCase();
    return this.proyectosExistentes.some(p => {
      if (this.proyectoId && p.id === this.proyectoId) return false;
      const idsActuales = Array.isArray(p.trabajadores)
        ? p.trabajadores.map(t => t.id).sort()
        : p.trabajador
          ? [p.trabajador.id]
          : [];
      const idsNuevos = [...this.proyecto.trabajadorIds].sort();
      return p.titulo.toLowerCase() === titulo
        && idsActuales.length === idsNuevos.length
        && idsActuales.every((id, index) => id === idsNuevos[index]);
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/proyectos']);
  }
}
