# Integración Frontend-Backend - UNAD Video Platform

## ✅ Integración Completada

Se ha conectado exitosamente el frontend con el backend utilizando servicios API y axios.

## 📁 Estructura Creada

```
Front/
├── src/
│   ├── config/
│   │   └── api.js                    # Configuración de axios con interceptores JWT
│   ├── services/
│   │   ├── AuthService.js            # Servicio de autenticación
│   │   ├── UserService.js            # CRUD de usuarios
│   │   ├── RoleService.js            # CRUD de roles
│   │   └── VideoService.js           # CRUD de videos
│   ├── components/
│   │   └── ProtectedRoute.jsx        # Componente para proteger rutas
│   ├── pages/
│   │   ├── Login.jsx                 # ✅ Conectado con AuthService
│   │   ├── Users.jsx                 # ✅ CRUD completo con UserService
│   │   └── VideosAdmin.jsx           # ✅ CRUD completo con VideoService
│   └── App.jsx                       # ✅ Rutas protegidas
├── .env                              # Variables de entorno
└── .env.example                      # Ejemplo de configuración
```

## 🔧 Configuración

### 1. Variables de Entorno

Archivo `.env` ya creado con:
```env
VITE_API_URL=http://localhost:8080
```

**Ajusta la URL según tu backend:**
- Local: `http://localhost:8080`
- Producción: `https://tu-api.com`

### 2. Iniciar el Backend

Asegúrate de que tu backend Spring Boot esté corriendo en el puerto 8080:

```bash
cd Back
./mvnw spring-boot:run
```

### 3. Iniciar el Frontend

```bash
cd Front
npm run dev
```

## 🚀 Funcionalidades Implementadas

### 🔐 Autenticación (Login.jsx)
- ✅ Login con email y número de documento
- ✅ Guardado de token JWT en localStorage
- ✅ Manejo de errores de autenticación
- ✅ Redirección automática después del login
- ✅ Toggle de visibilidad de documento

### 👥 Gestión de Usuarios (Users.jsx)
- ✅ Listar todos los usuarios
- ✅ Crear nuevo usuario
- ✅ Editar usuario existente
- ✅ Eliminar usuario
- ✅ Cargar roles desde el backend
- ✅ Validación de formularios
- ✅ Estados de carga y errores

### 🎥 Gestión de Videos (VideosAdmin.jsx)
- ✅ Listar todos los videos
- ✅ Crear nuevo video
- ✅ Editar video existente
- ✅ Eliminar video
- ✅ Gestión de tags
- ✅ Configuración de visibilidad
- ✅ Activar/desactivar comentarios

### 🛡️ Seguridad
- ✅ Interceptor automático de JWT en todas las peticiones
- ✅ Redirección a /login si el token expira (401)
- ✅ Rutas protegidas con ProtectedRoute
- ✅ Limpieza de localStorage al cerrar sesión

## 📡 Endpoints Conectados

### Auth
- `POST /api/auth/login` → AuthService.login()
  - **Request:** `{ email: string, documentNumber: string }`
  - **Response:** `ApiResponse<{ token, tokenType, role, userId }>`

### Users
- `GET /api/users` → UserService.getAll()
- `GET /api/users/{id}` → UserService.getById()
- `GET /api/users/search/email?email=...` → UserService.searchByEmail()
- `GET /api/users/search/document?documentNumber=...` → UserService.searchByDocument()
- `GET /api/users/role/{roleId}` → UserService.getByRole()
- `GET /api/users/exists/email?email=...` → UserService.existsByEmail()
- `GET /api/users/exists/document?documentNumber=...` → UserService.existsByDocument()
- `POST /api/users` → UserService.create()
- `PUT /api/users/{id}` → UserService.update()
- `DELETE /api/users/{id}` → UserService.delete()

### Roles
- `GET /api/roles` → RoleService.getAll()
- `GET /api/roles/{id}` → RoleService.getById()
- `GET /api/roles/search?name=...` → RoleService.searchByName()
- `GET /api/roles/exists?name=...` → RoleService.existsByName()
- `POST /api/roles` → RoleService.create()
- `PUT /api/roles/{id}` → RoleService.update()
- `DELETE /api/roles/{id}` → RoleService.delete()

### Videos
- `GET /api/videos` → VideoService.getAll()
- `GET /api/videos/{id}` → VideoService.getById()
- `POST /api/videos` → VideoService.create()
- `PUT /api/videos/{id}` → VideoService.update()
- `DELETE /api/videos/{id}` → VideoService.delete()

## 📦 Estructura de Datos (Backend)

### 👥 Usuarios

#### Crear Usuario (POST /api/users)

El backend **no** tiene campo `password`. El `documentNumber` se usa como método de autenticación.

**Campos requeridos (modelo backend):**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "documentType": "CC | TI | CE | PA",
  "documentNumber": "string",
  "role": { "id": 1 }
}
```

**Nota (frontend):** en el formulario se maneja `roleId`, pero el `UserService` lo convierte automáticamente a `role: { id }` antes de enviar al backend.

**Campos auto-generados/servidor:**
- `id`
- `createdAt`

**Campos que NO existen en el backend (se ignoran si se envían):**
- `password`
- `active`

**Ejemplo (request):**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@unad.edu.co",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "role": { "id": 1 }
}
```

#### Actualizar Usuario (PUT /api/users/{id})

Mismo formato que crear usuario.

#### Tipos de Documento válidos

| Código | Descripción |
|--------|-------------|
| `CC` | Cédula de Ciudadanía |
| `TI` | Tarjeta de Identidad |
| `CE` | Cédula de Extranjería |
| `PA` | Pasaporte |

## 🧪 Cómo Probar

### 1. Login
1. Abre http://localhost:5173 (o el puerto que indique tu terminal)
2. Ingresa:
   - **Correo Electrónico**: Email del usuario registrado
   - **Número de Documento**: Documento del usuario (el backend usa esto como autenticación)
3. Deberías ser redirigido a /main

**Nota importante:** El backend utiliza `documentNumber` como método de autenticación en lugar de password tradicional.

### 2. Gestión de Usuarios
1. Navega a `/admin/users`
2. Completa el formulario de nuevo usuario
3. Haz clic en "Crear Usuario"
4. Verás el usuario en la tabla
5. Prueba "Editar" y "Eliminar"

### 3. Gestión de Videos
1. Navega a `/admin/videos`
2. Llena el formulario con título, descripción y URL
3. Agrega tags presionando Enter
4. Haz clic en "Publicar Video"
5. Verás el video en la tabla inferior
6. Prueba "Editar" y "Eliminar"

## 🔍 Debugging

### Ver las peticiones HTTP
Abre las DevTools del navegador → Network → XHR

### Ver los tokens guardados
DevTools → Application → Local Storage
- `token`: JWT token
- `user`: Datos del usuario

### Errores comunes

**❌ Error CORS:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solución:** Configura CORS en tu backend Spring Boot para permitir `http://localhost:5173`

**❌ 400 Bad Request: Invalid input**
```
Bad Request: Invalid input
```
**Solución:** Verifica que estás enviando `email` y `documentNumber` (no `password`). El backend usa el número de documento para autenticar.

**❌ 401 Unauthorized:**
```
Request failed with status code 401
```
**Solución:** Token inválido o expirado. Vuelve a hacer login. O credenciales incorrectas (email o documentNumber inválidos).

**❌ 403 Forbidden:**
```
Request failed with status code 403
```
**Solución:** El usuario no tiene permisos de ADMIN para esa operación.

Todas las respuestas del backend siguen el formato `ApiResponse<T>`:

```json
{
  "code": 200,
  "status": "OK",
  "message": "Operation successful",
  "data": { ... }
}
```

Los servicios del frontend extraen automáticamente el campo `data` mediante:
```javascript
return response.data.data || response.data;
```

### Ejemplo de Login Exitoso

**Request:**
```json
{
  "email": "admin@unad.edu.co",
  "documentNumber": "1002003002"
}
```

**Response:**
```json
{
  "code": 200,
  "status": "OK",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "role": "ADMIN",
    "userId": 1
  }
}
```

## ⚠️ Importante: Autenticación con Documento

El backend actual usa **`documentNumber` en lugar de password** como método de autenticación. Esto es inusual en sistemas modernos.

**Para producción se recomienda:**
1. Agregar campo `password` encriptado en la entidad `User`
2. Usar BCrypt para encriptar passwords
3. Cambiar `LoginRequest` para validar password en vez de documento

**Estructura actual:**
```java
public class LoginRequest {
    private String email;
    private String documentNumber;  // Usado como "contraseña"
}
```

**Recomendado para producción:**
```java
public class LoginRequest {
    private String email;
    private String password;  // Password encriptado
}
```

## 📝 Próximos Pasos Opcionales

1. **Mejorar autenticación** - Implementar password real en lugar de documentNumber
2. **Agregar paginación** en las tablas de usuarios y videos
3. **Implementar búsqueda y filtros** en tiempo real
4. **Agregar confirmaciones modales** en vez de `alert()`
5. **Crear un contexto global** de autenticación (AuthContext)
6. **Mejorar validaciones** del frontend antes de enviar al backend
7. **Agregar manejo de archivos** para subida de videos
8. **Implementar refresh token** para renovar tokens expirados

## 📚 Recursos

- [Axios Documentation](https://axios-http.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**¡Listo para desarrollar! 🚀**

Si necesitas agregar más funcionalidades o ajustar algo, no dudes en preguntar.

## Actualizacion: foro, notificaciones y arbol de categorias

### Servicios y componentes nuevos
- `src/services/ForumService.js` incluye `markNotificationsSeen(userId)`.
- `src/components/CategoryTreeFilter.jsx` muestra un arbol de dos niveles: categoria -> videos.
- `src/pages/VideosLibrary.jsx` conserva el buscador por titulo y el ordenamiento, y reemplaza los chips horizontales por el arbol de categorias.

### Endpoints de foro conectados
- `GET /api/forum/conversations` -> ForumService.getConversations()
- `GET /api/forum/content/{contentId}/questions` -> ForumService.getQuestionsByContent()
- `GET /api/forum/notifications/{userId}` -> ForumService.getNotifications()
- `PUT /api/forum/notifications/{userId}/seen` -> ForumService.markNotificationsSeen()
- `POST /api/forum/questions` -> ForumService.createQuestion()

### Comportamiento esperado
- Al abrir la campana, el frontend marca las notificaciones como vistas y refresca el contador.
- El historial del dropdown se conserva aunque el contador baje a 0.
- Las preguntas o respuestas creadas despues del ultimo visto vuelven a contar como pendientes.
- Al seleccionar una categoria del arbol se filtra la biblioteca; seleccionar el mismo nodo o "Todas las categorias" limpia el filtro.
