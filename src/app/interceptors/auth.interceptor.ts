import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  console.log('🔍 Interceptor ejecutándose - URL:', req.url);

  // Solo agregar el token si estamos en el navegador
  if (isBrowser) {
    const token = authService.getToken();
    console.log('🔍 Token:', token ? 'EXISTS (' + token.substring(0, 20) + '...)' : 'NULL');

    if (token && !req.url.includes('/login')) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('✅ Token agregado al header Authorization');
      return next(cloned);
    }
  }

  return next(req);
};
