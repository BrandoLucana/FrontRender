import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { TrabajadoresListComponent } from './components/trabajadores/trabajadores-list/trabajadores-list.component';
import { TrabajadorFormComponent } from './components/trabajadores/trabajador-form/trabajador-form.component';
import { ProyectosListComponent } from './components/proyectos/proyectos-list/proyectos-list.component';
import { ProyectoFormComponent } from './components/proyectos/proyecto-form/proyecto-form.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'trabajadores', component: TrabajadoresListComponent },
      { path: 'nuevo-trabajador', component: TrabajadorFormComponent },
      { path: 'editar-trabajador/:id', component: TrabajadorFormComponent },
      { path: 'proyectos', component: ProyectosListComponent },
      { path: 'nuevo-proyecto', component: ProyectoFormComponent },
      { path: 'editar-proyecto/:id', component: ProyectoFormComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
