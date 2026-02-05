# 🔴 SOLUCIÓN AL ERROR 403 FORBIDDEN

## ❌ Problema Actual

El frontend envía correctamente el token JWT en el header `Authorization: Bearer <token>`, pero el **backend responde con 403 (Forbidden)**.

**Evidencia en la consola:**
```
✅ Token agregado al header Authorization
❌ Failed to load resource: the server responded with a status of 403 ()
```

## 🔍 Diagnóstico

El error 403 significa que Spring Security en el backend está **rechazando las peticiones autenticadas**. Posibles causas:

1. ❌ No hay `JwtAuthenticationFilter` configurado
2. ❌ El filtro JWT no está validando el token correctamente
3. ❌ La clave secreta JWT no coincide entre login y validación
4. ❌ Las rutas `/api/trabajadores` y `/api/proyectos` no están permitidas para usuarios autenticados
5. ❌ El filtro CORS está bloqueando los headers

---

## ✅ SOLUCIÓN: Configurar Spring Security Correctamente

### Paso 1: Verificar que exista `JwtAuthenticationFilter`

Tu backend debe tener un filtro que intercepte cada petición y valide el token JWT del header `Authorization`.

**Ubicación esperada:** `backend/src/main/java/com/developers/security/JwtAuthenticationFilter.java`

```java
package com.developers.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebSecurityConfigurerAdapter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        System.out.println("🔍 JwtAuthenticationFilter - URL: " + request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        System.out.println("🔑 Authorization Header: " + (authHeader != null ? "EXISTS" : "NULL"));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            System.out.println("👤 Username extraído del token: " + username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(token, userDetails.getUsername())) {
                    System.out.println("✅ Token válido - Autenticando usuario");

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                        );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    System.out.println("❌ Token inválido");
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

---

### Paso 2: Configurar `SecurityFilterChain`

Asegúrate de que tu `SecurityConfig.java` tenga:

1. ✅ El filtro JWT agregado **ANTES** del filtro de autenticación
2. ✅ Las rutas `/api/trabajadores/**` y `/api/proyectos/**` requieran autenticación
3. ✅ CORS habilitado

```java
package com.developers.config;

import com.developers.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers("/api/auth/**").permitAll()

                // Rutas protegidas - REQUIEREN TOKEN JWT
                .requestMatchers("/api/trabajadores/**").authenticated()
                .requestMatchers("/api/proyectos/**").authenticated()

                // Cualquier otra ruta también requiere autenticación
                .anyRequest().authenticated()
            )
            // CRÍTICO: Agregar el filtro JWT ANTES del filtro de autenticación
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",  // Angular
            "http://localhost:3000",  // React
            "http://localhost:5173"   // Vite
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

### Paso 3: Verificar `JwtUtil`

La clave secreta debe ser la MISMA en login y validación:

```java
package com.developers.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // ⚠️ CRÍTICO: Esta clave debe ser la MISMA siempre
    private static final String SECRET_KEY = "tu-clave-secreta-super-segura-de-al-menos-256-bits-para-jwt";
    private static final long EXPIRATION_TIME = 86400000; // 24 horas

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean validateToken(String token, String username) {
        String tokenUsername = extractUsername(token);
        return tokenUsername.equals(username) && !isTokenExpired(token);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}
```

---

## 🧪 Cómo Verificar que Funciona

### 1. Reinicia el backend

```bash
cd backend
mvn clean package
java -jar target/management-system-0.0.1-SNAPSHOT.jar
```

### 2. Observa los logs del backend

Al hacer una petición desde el frontend, deberías ver:

```
🔍 JwtAuthenticationFilter - URL: /api/trabajadores
🔑 Authorization Header: EXISTS
👤 Username extraído del token: admin
✅ Token válido - Autenticando usuario
```

Si ves `❌ Token inválido`, la clave secreta no coincide.

### 3. Verifica en el frontend

Recarga la página (Ctrl + Shift + R), haz login y:
- ✅ La lista de trabajadores debe cargarse
- ✅ La lista de proyectos debe cargarse
- ✅ Puedes crear/editar trabajadores

---

## 📋 Checklist de Verificación

- [ ] Existe `JwtAuthenticationFilter.java` en el backend
- [ ] `SecurityConfig.java` tiene `.addFilterBefore(jwtAuthenticationFilter, ...)`
- [ ] Las rutas `/api/trabajadores/**` tienen `.authenticated()`
- [ ] La clave secreta en `JwtUtil` es consistente
- [ ] CORS permite `http://localhost:4200`
- [ ] El backend se reinició después de los cambios

---

## 🆘 Si Aún No Funciona

Revisa los logs del backend cuando hagas login y cuando intentes cargar trabajadores. Debería aparecer:

```
Login exitoso - generando token para: admin
🔍 JwtAuthenticationFilter - URL: /api/trabajadores
✅ Token válido - Autenticando usuario
```

Si no aparecen estos logs, el filtro no se está ejecutando.

---

## 📞 Problema Común

**"El token se genera pero no se valida"**

Causa: La clave secreta es diferente entre `AuthController` (al generar) y `JwtAuthenticationFilter` (al validar).

Solución: Usar la misma constante `SECRET_KEY` en ambos lados.
