import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrabajadorService } from '../../services/trabajador.service';
import { ProyectoService } from '../../services/proyecto.service';
import { Trabajador } from '../../models/trabajador.model';
import { Proyecto } from '../../models/proyecto.model';
import { EstadoProyecto, Cargo } from '../../models/enums';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  totalTrabajadores = 0;
  trabajadoresActivos = 0;
  totalProyectos = 0;
  proyectosPendientes = 0;
  proyectosEnProgreso = 0;
  proyectosCompletados = 0;
  isLoading = true;

  trabajadores: Trabajador[] = [];
  proyectos: Proyecto[] = [];
  estadosProyecto = Object.values(EstadoProyecto);
  cargosStats: { name: string; count: number }[] = [];

  constructor(
    private trabajadorService: TrabajadorService,
    private proyectoService: ProyectoService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.trabajadorService.getAll().subscribe({
      next: (trabajadores) => {
        this.trabajadores = trabajadores;
        this.totalTrabajadores = trabajadores.length;
        this.trabajadoresActivos = trabajadores.filter(t => t.estadoRegistro === 'ACTIVO').length;
        this.calculateCargosStats();
      },
      error: (error) => console.error('Error loading trabajadores:', error)
    });

    this.proyectoService.getAll().subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos;
        this.totalProyectos = proyectos.length;
        this.proyectosPendientes = proyectos.filter(p => p.estado === 'PENDIENTE').length;
        this.proyectosEnProgreso = proyectos.filter(p => p.estado === 'EN_PROGRESO').length;
        this.proyectosCompletados = proyectos.filter(p => p.estado === 'COMPLETADO').length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading proyectos:', error);
        this.isLoading = false;
      }
    });
  }

  calculateCargosStats(): void {
    const cargoCount: { [key: string]: number } = {};

    Object.values(Cargo).forEach(cargo => {
      cargoCount[cargo] = 0;
    });

    this.trabajadores.forEach(t => {
      if (cargoCount[t.cargo] !== undefined) {
        cargoCount[t.cargo]++;
      }
    });

    this.cargosStats = Object.entries(cargoCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getProyectosCount(estado: string): number {
    return this.proyectos.filter(p => p.estado === estado).length;
  }

  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'PENDIENTE': 'bar-warning',
      'EN_PROGRESO': 'bar-info',
      'COMPLETADO': 'bar-success',
      'CANCELADO': 'bar-danger'
    };
    return classes[estado] || 'bar-default';
  }

  getCompletionRate(): number {
    if (this.totalProyectos === 0) return 0;
    return Math.round((this.proyectosCompletados / this.totalProyectos) * 100);
  }

  getProyectosPorTrabajador(): string {
    if (this.trabajadoresActivos === 0) return '0';
    return (this.totalProyectos / this.trabajadoresActivos).toFixed(1);
  }
}
