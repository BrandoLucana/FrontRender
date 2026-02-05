# Sistema de Gestión de Trabajadores y Proyectos

Sistema completo con frontend Angular y backend configurado para gestionar trabajadores y sus proyectos asignados.

## 🚀 Características

- ✅ **Autenticación JWT** - Login seguro con token de 24 horas
- ✅ **Gestión de Trabajadores** - CRUD completo con diferentes cargos
- ✅ **Gestión de Proyectos** - Asignación y seguimiento de proyectos
- ✅ **Dashboard Interactivo** - Estadísticas y accesos rápidos
- ✅ **Diseño Moderno** - Interfaz responsive y atractiva
- ✅ **Protección de Rutas** - Solo usuarios admin pueden acceder

## 📋 Requisitos Previos

### Backend (Ya configurado)
- Java 17+
- MySQL 8.0+
- Maven

### Frontend
- Node.js 18+
- Angular CLI 17

## 🔧 Configuración

### 1. Base de Datos MySQL

Crear la base de datos (se crea automáticamente si no existe):
```sql
CREATE DATABASE Developers;
```

El backend creará las tablas automáticamente al iniciar.

### 2. Backend

El backend ya está configurado en la carpeta `backend/`. Para iniciarlo:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

El servidor estará corriendo en `http://localhost:8080`

**Credenciales de Admin (crear manualmente en la BD):**
```sql
-- Insertar usuario admin (password: "admin123" encriptado con BCrypt)
INSERT INTO usuarios (username, password, role, estado_registro) 
VALUES ('admin', '$2a$10$YourBCryptHashHere', 'ROLE_ADMIN', 'ACTIVO');
```

### 3. Frontend Angular

Instalar dependencias:
```bash
npm install
```

Iniciar el servidor de desarrollo:
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## 🎯 Uso del Sistema

### Primera Vez

1. **Iniciar Backend**: Ejecutar el backend de Spring Boot
2. **Crear Usuario Admin**: Insertar un usuario admin en la base de datos
3. **Iniciar Frontend**: Ejecutar `npm start`
4. **Acceder**: Abrir `http://localhost:4200` - se mostrará el login

### Login

- **URL**: `http://localhost:4200/login`
- **Usuario**: El que hayas creado en la BD (ej: `admin`)
- **Contraseña**: La que hayas configurado

### Navegación

Después del login, accederás al dashboard con:

- **Home** - Estadísticas generales
- **Trabajadores** - Lista, crear, editar, eliminar trabajadores
- **Proyectos** - Lista, crear, editar, eliminar proyectos
- **Nuevo Trabajador** - Formulario de registro
- **Nuevo Proyecto** - Formulario de asignación

## 📊 Características Principales

### Gestión de Trabajadores

- Ver lista completa de trabajadores
- Crear nuevos trabajadores
- Editar información
- Eliminar trabajadores
- Ver detalles y proyectos asignados
- Asignar proyectos desde el detalle

**Cargos disponibles:**
- Programador
- Ingeniero de Sistemas
- Analista
- Diseñador UX/UI
- QA Tester
- DevOps
- Jefe de Proyecto

### Gestión de Proyectos

- Ver todos los proyectos
- Filtrar por estado
- Crear nuevo proyecto
- Editar proyecto existente
- Cambiar estado del proyecto
- Eliminar proyectos

**Estados de Proyecto:**
- Pendiente
- En Progreso
- Completado
- Cancelado

## 🔐 Seguridad

- Todas las rutas (excepto login) están protegidas con AuthGuard
- Se requiere rol ROLE_ADMIN para acceder al sistema
- Token JWT válido por 24 horas
- Interceptor HTTP que agrega automáticamente el token a todas las peticiones

## 🎨 Interfaz

- Diseño moderno con gradientes y sombras
- Tablas responsivas y fáciles de leer
- Modales para confirmaciones y detalles
- Badges de estado con colores diferenciados
- Navegación lateral colapsable
- Iconos SVG integrados

## 📱 Responsive

La interfaz es completamente responsive y se adapta a:
- Desktop (1200px+)
- Tablets (768px - 1199px)
- Móviles (< 768px)

## 🛠️ Estructura del Proyecto

```
FrontendDevelepers/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── home/
│   │   │   ├── trabajadores/
│   │   │   │   ├── trabajadores-list/
│   │   │   │   └── trabajador-form/
│   │   │   └── proyectos/
│   │   │       ├── proyectos-list/
│   │   │       └── proyecto-form/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── trabajador.service.ts
│   │   │   └── proyecto.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   └── models/
│   │       ├── auth.model.ts
│   │       ├── trabajador.model.ts
│   │       ├── proyecto.model.ts
│   │       └── enums.ts
│   └── styles.css
└── backend/
    └── (Archivos Spring Boot)
```

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login (público)

### Trabajadores (Requiere autenticación + ROLE_ADMIN)
- `GET /api/trabajadores` - Listar todos
- `GET /api/trabajadores/{id}` - Obtener por ID
- `POST /api/trabajadores` - Crear
- `PUT /api/trabajadores/{id}` - Actualizar
- `DELETE /api/trabajadores/{id}` - Eliminar

### Proyectos (Requiere autenticación + ROLE_ADMIN)
- `GET /api/proyectos` - Listar todos
- `GET /api/proyectos/{id}` - Obtener por ID
- `POST /api/proyectos` - Crear
- `PUT /api/proyectos/{id}` - Actualizar
- `DELETE /api/proyectos/{id}` - Eliminar
- `GET /api/proyectos/trabajador/{trabajadorId}` - Por trabajador
- `GET /api/proyectos/estado/{estado}` - Por estado
- `PATCH /api/proyectos/{id}/estado` - Actualizar solo estado

## 🐛 Solución de Problemas

### Error de CORS
Si aparecen errores de CORS, verificar que el backend tenga configurado:
```java
@CrossOrigin(origins = "http://localhost:4200")
```

### Error 401 Unauthorized
- Verificar que el token no haya expirado
- Verificar credenciales de login
- Revisar que el usuario tenga ROLE_ADMIN

### Backend no conecta a MySQL
- Verificar que MySQL esté corriendo
- Revisar las credenciales en `application.properties`
- Verificar que la base de datos exista

## 📝 Formato de Fechas

El sistema usa formato `d/M/yyyy`:
- Ejemplo: `26/1/2026`
- Día sin cero a la izquierda
- Mes sin cero a la izquierda
- Año con 4 dígitos

## 💡 Consejos

1. **Crear Usuario Admin primero** - Sin usuario admin no podrás acceder
2. **Iniciar backend antes que frontend** - El frontend necesita la API
3. **Usar Chrome DevTools** - Para ver errores de red si hay problemas
4. **Revisar consola del navegador** - Los errores se muestran ahí

## 🎓 Próximos Pasos

Ideas para mejorar el sistema:

- [ ] Paginación en las tablas
- [ ] Búsqueda y filtros avanzados
- [ ] Exportar a PDF/Excel
- [ ] Notificaciones en tiempo real
- [ ] Gráficos y reportes
- [ ] Gestión de permisos más granular
- [ ] Historial de cambios
- [ ] Upload de archivos adjuntos

## 📞 Soporte

Para problemas o preguntas:
1. Revisar la consola del navegador
2. Revisar logs del backend
3. Verificar que todos los servicios estén corriendo

---

**Desarrollado con ❤️ usando Angular 17 y Spring Boot**
