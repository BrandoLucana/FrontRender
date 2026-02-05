import { EstadoProyecto, EstadoRegistro } from './enums';
import { Trabajador } from './trabajador.model';

export interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaLimite: string;
  estado: EstadoProyecto;
  estadoRegistro: EstadoRegistro;
  trabajador?: Trabajador | null;
  trabajadores?: Trabajador[];
}

export interface ProyectoDTO {
  titulo: string;
  descripcion: string;
  fechaAsignacion: string;
  fechaLimite: string;
  trabajadorIds: number[];
  estado?: EstadoProyecto;
}
