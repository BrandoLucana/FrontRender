import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TrabajadorService } from '../../../services/trabajador.service';
import { TrabajadorDTO, Trabajador } from '../../../models/trabajador.model';
import { Cargo, TipoDocumento } from '../../../models/enums';

@Component({
  selector: 'app-trabajador-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trabajador-form.component.html',
  styleUrls: ['./trabajador-form.component.css']
})
export class TrabajadorFormComponent implements OnInit {
  trabajadorId: number | null = null;
  isEdit = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showConfirmModal = false;
  private confirmEditPending = false;
  private trabajadoresExistentes: Trabajador[] = [];

  trabajador: TrabajadorDTO = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaIngreso: this.getCurrentDate(),
    cargo: 'PROGRAMADOR',
    tipoDocumento: TipoDocumento.DNI,
    numeroDocumento: ''
  };

  cargos = Object.values(Cargo);
  tiposDocumento = Object.values(TipoDocumento);

  constructor(
    private trabajadorService: TrabajadorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.trabajadorId) {
      this.isEdit = true;
      this.loadTrabajador();
    }

    this.loadTrabajadoresExistentes();
  }

  loadTrabajadoresExistentes(): void {
    this.trabajadorService.getAll().subscribe({
      next: (data) => {
        this.trabajadoresExistentes = data;
      },
      error: () => {
        this.trabajadoresExistentes = [];
      }
    });
  }

  loadTrabajador(): void {
    if (this.trabajadorId) {
      this.trabajadorService.getById(this.trabajadorId).subscribe({
        next: (data: Trabajador) => {
          this.trabajador = {
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            telefono: data.telefono,
            fechaIngreso: data.fechaIngreso,
            cargo: data.cargo,
            tipoDocumento: data.tipoDocumento,
            numeroDocumento: data.numeroDocumento
          };
        },
        error: (error) => {
          console.error('Error loading trabajador:', error);
          this.errorMessage = 'Error al cargar el trabajador';
        }
      });
    }
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

    const operation = this.isEdit && this.trabajadorId
      ? this.trabajadorService.update(this.trabajadorId, this.trabajador)
      : this.trabajadorService.create(this.trabajador);

    console.log('📤 Enviando trabajador:', this.trabajador);

    operation.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.confirmEditPending = false;
        console.log('✅ Trabajador guardado exitosamente:', response);
        this.successMessage = this.isEdit
          ? 'Trabajador actualizado exitosamente'
          : 'Trabajador creado exitosamente';

        setTimeout(() => {
          this.router.navigate(['/dashboard/trabajadores']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.confirmEditPending = false;
        console.error('❌ Error completo:', error);

        // Identificar tipo de error
        if (error.status === 0) {
          this.errorMessage = '🔴 ERROR DE CONEXIÓN: No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (error.status === 401) {
          this.errorMessage = '🔴 ERROR 401 NO AUTORIZADO: Tu sesión expiró. Por favor vuelve a iniciar sesión';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 403) {
          this.errorMessage = '🔴 ERROR 403 PROHIBIDO: El servidor rechaza tu token JWT. Problema de configuración en Spring Security del backend';
          console.error('💡 SOLUCIÓN: Verifica que el backend tenga configurado correctamente:');
          console.error('   1. JwtAuthenticationFilter para validar tokens');
          console.error('   2. SecurityFilterChain con .authenticated() en las rutas /api/trabajadores');
          console.error('   3. Secreto JWT coincida entre login y validación');
        } else if (error.status === 404) {
          this.errorMessage = '🔴 ERROR 404: Endpoint no encontrado. Verifica que el backend tenga el controlador /api/trabajadores';
        } else if (error.status === 500) {
          this.errorMessage = '🔴 ERROR 500: Error interno del servidor. Revisa los logs del backend';
          if (error.error?.message) {
            this.errorMessage += ` - ${error.error.message}`;
          }
        } else {
          this.errorMessage = `🔴 ERROR ${error.status}: ${error.error?.message || 'Error al guardar el trabajador'}`;
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
    const nombreOriginal = this.trabajador.nombre ?? '';
    const apellidoOriginal = this.trabajador.apellido ?? '';
    const emailOriginal = this.trabajador.email ?? '';
    const telefonoOriginal = this.trabajador.telefono ?? '';
    const numeroDocumentoOriginal = this.trabajador.numeroDocumento ?? '';

    if (/\s/.test(emailOriginal)) {
      this.errorMessage = '⚠️ El email no puede contener espacios';
      return false;
    }
    if (/[^0-9]/.test(telefonoOriginal)) {
      this.errorMessage = '⚠️ El teléfono solo puede contener números';
      return false;
    }

    // Normalizar datos
    this.trabajador.nombre = this.normalizeNameFinal(nombreOriginal);
    this.trabajador.apellido = this.normalizeNameFinal(apellidoOriginal);
    this.trabajador.email = emailOriginal.trim().toLowerCase();
    this.trabajador.telefono = telefonoOriginal.trim();
    this.trabajador.numeroDocumento = numeroDocumentoOriginal.trim().toUpperCase();

    // Validar nombre
    if (!this.trabajador.nombre || this.trabajador.nombre.length < 2) {
      this.errorMessage = '⚠️ El nombre debe tener al menos 2 caracteres';
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.trabajador.nombre)) {
      this.errorMessage = '⚠️ El nombre solo puede contener letras';
      return false;
    }

    // Validar apellido
    if (!this.trabajador.apellido || this.trabajador.apellido.length < 2) {
      this.errorMessage = '⚠️ El apellido debe tener al menos 2 caracteres';
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.trabajador.apellido)) {
      this.errorMessage = '⚠️ El apellido solo puede contener letras';
      return false;
    }

    // Validar email
    if (!this.trabajador.email) {
      this.errorMessage = '⚠️ El email es obligatorio';
      return false;
    }
    if (!this.isValidEmail(this.trabajador.email)) {
      this.errorMessage = '⚠️ Ingrese un email válido (ejemplo: usuario@empresa.com)';
      return false;
    }

    // Validar teléfono
    if (!this.trabajador.telefono) {
      this.errorMessage = '⚠️ El teléfono es obligatorio';
      return false;
    }
    // Validar teléfono peruano: debe empezar con 9 y tener 9 dígitos
    if (!/^9\d{8}$/.test(this.trabajador.telefono)) {
      this.errorMessage = '⚠️ El teléfono debe ser un número válido peruano (9 dígitos empezando con 9)';
      return false;
    }

    if (!this.trabajador.tipoDocumento) {
      this.errorMessage = '⚠️ Debe seleccionar el tipo de documento';
      return false;
    }

    if (!this.trabajador.numeroDocumento) {
      this.errorMessage = '⚠️ El número de documento es obligatorio';
      return false;
    }

    if (!this.isValidDocumento(this.trabajador.tipoDocumento, this.trabajador.numeroDocumento)) {
      this.errorMessage = '⚠️ El número de documento no tiene el formato válido';
      return false;
    }

    if (this.isDuplicateTrabajador()) {
      this.errorMessage = '⚠️ Ya existe un trabajador con el mismo email, teléfono o documento';
      return false;
    }

    // Validar fecha
    if (!this.trabajador.fechaIngreso) {
      this.errorMessage = '⚠️ La fecha de ingreso es obligatoria';
      return false;
    }

    // Validar que la fecha de ingreso no sea anterior a hoy (solo en creación)
    if (!this.isEdit) {
      const hoy = this.parseDateDMY(this.getCurrentDate());
      const fechaIngreso = this.parseDateDMY(this.trabajador.fechaIngreso);

      if (fechaIngreso < hoy) {
        this.errorMessage = '⚠️ La fecha de ingreso no puede ser anterior a la fecha actual';
        return false;
      }
    }

    // Validar cargo
    if (!this.trabajador.cargo) {
      this.errorMessage = '⚠️ Debe seleccionar un cargo';
      return false;
    }

    return true;
  }

  parseDateDMY(dateStr: string): Date {
    const parts = dateStr.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  normalizeNameFinal(value: string): string {
    return value
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  normalizeNameForInput(value: string): string {
    return value
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/^\s+/, '')
      .replace(/\s{2,}/g, ' ');
  }

  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeNameForInput(input.value);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    this.trabajador.nombre = normalized;
  }

  onApellidoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeNameForInput(input.value);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    this.trabajador.apellido = normalized;
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = input.value.replace(/\s+/g, '').toLowerCase();
    if (normalized !== input.value) {
      input.value = normalized;
    }
    this.trabajador.email = normalized;
  }

  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = input.value.replace(/[^0-9]/g, '').slice(0, 9);
    if (normalized !== input.value) {
      input.value = normalized;
    }
    this.trabajador.telefono = normalized;
  }

  onNumeroDocumentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase().replace(/\s+/g, '');

    if (this.trabajador.tipoDocumento === TipoDocumento.DNI) {
      value = value.replace(/[^0-9]/g, '').slice(0, 8);
    } else if (this.trabajador.tipoDocumento === TipoDocumento.CARNET_EXTRANJERIA) {
      value = value.replace(/[^A-Z0-9]/g, '').slice(0, 12);
    } else if (this.trabajador.tipoDocumento === TipoDocumento.RUC) {
      value = value.replace(/[^0-9]/g, '').slice(0, 11);
    } else if (this.trabajador.tipoDocumento === TipoDocumento.RIF) {
      value = value.replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }

    if (value !== input.value) {
      input.value = value;
    }
    this.trabajador.numeroDocumento = value;
  }

  onTipoDocumentoChange(): void {
    this.trabajador.numeroDocumento = '';
  }

  getNumeroDocumentoPlaceholder(): string {
    switch (this.trabajador.tipoDocumento) {
      case TipoDocumento.DNI:
        return '8 dígitos';
      case TipoDocumento.CARNET_EXTRANJERIA:
        return '9-12 alfanuméricos';
      case TipoDocumento.RUC:
        return '11 dígitos';
      case TipoDocumento.RIF:
        return 'V/E/J/G + 9 dígitos o 11 dígitos';
      default:
        return 'Ingrese el número';
    }
  }

  private isDuplicateTrabajador(): boolean {
    const email = this.trabajador.email.toLowerCase();
    const telefono = this.trabajador.telefono;
    const tipoDocumento = this.trabajador.tipoDocumento;
    const numeroDocumento = this.trabajador.numeroDocumento.toUpperCase();
    return this.trabajadoresExistentes.some(t => {
      if (this.trabajadorId && t.id === this.trabajadorId) return false;
      return t.email.toLowerCase() === email
        || t.telefono === telefono
        || (t.tipoDocumento === tipoDocumento && t.numeroDocumento.toUpperCase() === numeroDocumento);
    });
  }

  private isValidDocumento(tipo: TipoDocumento, numero: string): boolean {
    switch (tipo) {
      case TipoDocumento.DNI:
        return /^\d{8}$/.test(numero);
      case TipoDocumento.CARNET_EXTRANJERIA:
        return /^[A-Z0-9]{9,12}$/.test(numero);
      case TipoDocumento.RUC:
        return /^\d{11}$/.test(numero);
      case TipoDocumento.RIF:
        return /^(?:[VEJG]\d{9}|\d{11})$/.test(numero);
      default:
        return false;
    }
  }

  getCurrentDate(): string {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  cancel(): void {
    this.router.navigate(['/dashboard/trabajadores']);
  }
}
