-- ============================================
-- SCRIPT DE INICIALIZACIÓN
-- Sistema de Gestión de Trabajadores y Proyectos
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS Developers;
USE Developers;

-- Las tablas se crean automáticamente por JPA/Hibernate
-- Este script solo inserta datos de ejemplo

-- ============================================
-- CREAR USUARIO ADMINISTRADOR
-- ============================================
-- Contraseña: admin123
-- IMPORTANTE: Cambiar el password en producción
INSERT INTO usuarios (username, password, role, estado_registro)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCu', 'ROLE_ADMIN', 'ACTIVO')
ON DUPLICATE KEY UPDATE username=username;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Trabajadores de ejemplo
INSERT INTO trabajadores (nombre, apellido, email, telefono, fecha_ingreso, cargo, estado_registro, fecha_ingreso_texto)
VALUES
('Juan', 'Pérez', 'juan.perez@empresa.com', '+1234567890', NOW(), 'PROGRAMADOR', 'ACTIVO', '1/1/2024'),
('María', 'García', 'maria.garcia@empresa.com', '+1234567891', NOW(), 'INGENIERO_SISTEMAS', 'ACTIVO', '15/1/2024'),
('Carlos', 'López', 'carlos.lopez@empresa.com', '+1234567892', NOW(), 'ANALISTA', 'ACTIVO', '1/2/2024'),
('Ana', 'Martínez', 'ana.martinez@empresa.com', '+1234567893', NOW(), 'DISENADOR_UX_UI', 'ACTIVO', '10/2/2024'),
('Pedro', 'Rodríguez', 'pedro.rodriguez@empresa.com', '+1234567894', NOW(), 'QA_TESTER', 'ACTIVO', '1/3/2024')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Proyectos de ejemplo
INSERT INTO proyectos (titulo, descripcion, fecha_asignacion, fecha_limite, estado, estado_registro, trabajador_id, fecha_asignacion_texto, fecha_limite_texto)
SELECT
  'Sistema de Ventas',
  'Desarrollo de sistema web para gestión de ventas',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 3 MONTH),
  'EN_PROGRESO',
  'ACTIVO',
  (SELECT id FROM trabajadores WHERE nombre = 'Juan' LIMIT 1),
  '26/1/2026',
  '26/4/2026'
WHERE EXISTS (SELECT 1 FROM trabajadores WHERE nombre = 'Juan')
ON DUPLICATE KEY UPDATE titulo=titulo;

INSERT INTO proyectos (titulo, descripcion, fecha_asignacion, fecha_limite, estado, estado_registro, trabajador_id, fecha_asignacion_texto, fecha_limite_texto)
SELECT
  'App Móvil E-commerce',
  'Aplicación móvil para tienda online',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 2 MONTH),
  'PENDIENTE',
  'ACTIVO',
  (SELECT id FROM trabajadores WHERE nombre = 'María' LIMIT 1),
  '26/1/2026',
  '26/3/2026'
WHERE EXISTS (SELECT 1 FROM trabajadores WHERE nombre = 'María')
ON DUPLICATE KEY UPDATE titulo=titulo;

INSERT INTO proyectos (titulo, descripcion, fecha_asignacion, fecha_limite, estado, estado_registro, trabajador_id, fecha_asignacion_texto, fecha_limite_texto)
SELECT
  'Dashboard Analítico',
  'Panel de control con métricas y KPIs',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 MONTH),
  'EN_PROGRESO',
  'ACTIVO',
  (SELECT id FROM trabajadores WHERE nombre = 'Carlos' LIMIT 1),
  '26/1/2026',
  '26/2/2026'
WHERE EXISTS (SELECT 1 FROM trabajadores WHERE nombre = 'Carlos')
ON DUPLICATE KEY UPDATE titulo=titulo;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Usuario admin creado exitosamente' AS Status;
SELECT COUNT(*) AS 'Total Trabajadores' FROM trabajadores;
SELECT COUNT(*) AS 'Total Proyectos' FROM proyectos;

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todos los trabajadores
-- SELECT * FROM trabajadores;

-- Ver todos los proyectos con sus trabajadores
-- SELECT p.*, t.nombre, t.apellido
-- FROM proyectos p
-- JOIN trabajadores t ON p.trabajador_id = t.id;

-- Ver proyectos por estado
-- SELECT estado, COUNT(*) as cantidad
-- FROM proyectos
-- GROUP BY estado;

-- Ver carga de trabajo por trabajador
-- SELECT t.nombre, t.apellido, COUNT(p.id) as proyectos_asignados
-- FROM trabajadores t
-- LEFT JOIN proyectos p ON t.id = p.trabajador_id AND p.estado != 'COMPLETADO'
-- GROUP BY t.id;
