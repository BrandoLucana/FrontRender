import { Cargo, EstadoRegistro, TipoDocumento } from './enums';

export interface Trabajador {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaIngreso: string;
  cargo: Cargo;
  estadoRegistro: EstadoRegistro;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

export interface TrabajadorDTO {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaIngreso: string;
  cargo: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}
