import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  username: string = '';
  sidebarCollapsed = false;
  showLogoutConfirm = false;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.username = this.authService.getUsername() || 'Admin';
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // En móviles, colapsar el sidebar por defecto
    if (this.isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;

    // En móviles, controlar el scroll del body
    if (this.isMobile) {
      if (this.sidebarCollapsed) {
        document.body.style.overflow = 'auto';
      } else {
        document.body.style.overflow = 'hidden';
      }
    }
  }

  // Cerrar sidebar automáticamente en móviles al hacer clic en un enlace
  closeSidebarOnMobile(): void {
    if (this.isMobile) {
      this.sidebarCollapsed = true;
      document.body.style.overflow = 'auto';
    }
  }

  logout(): void {
    this.showLogoutConfirm = true;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  ngOnDestroy(): void {
    // Limpiar estilos del body al destruir el componente
    document.body.style.overflow = 'auto';
  }
}
