# Sistema de Gestión Académica — Módulo Cursos

Trabajo de Programación IV. Aplicación con backend Express, MongoDB y frontend React con Material UI.

## Funcionalidades

- Inicio de sesión con JWT y permisos por rol.
- Consulta, registro, edición y eliminación de cursos.
- Validación de código, nombre y duración; control de códigos duplicados.
- Formulario y listado adaptables a celular, realizados con MUI sin CSS separado.
- Módulos de alumnos, docentes y materias del proyecto base.

## Requisitos

Node.js compatible con Vite 8 (22.12 o posterior) y MongoDB local activo en el puerto 27017.

## Instalación en PowerShell

Desde la raíz del repositorio:

```powershell
cd backend
Copy-Item .env.example .env
npm.cmd install
```

Editar `backend/.env` y reemplazar `JWT_SECRET` por una clave propia. Luego:

```powershell
node crearUsuario.js
npm.cmd run dev
```

Definir `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `backend/.env` antes de crear el administrador. Crearlo una sola vez para una base nueva. Para las pruebas REST Client, configurar las variables privadas `adminEmail` y `adminPassword` en el entorno de la extensión.

En otra terminal, desde la raíz del repositorio:

```powershell
cd frontend-react
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Abrir la dirección que indica Vite, normalmente http://localhost:5173. El backend usa http://localhost:3000.

## Organización

| Ruta | Contenido |
| --- | --- |
| backend/models/ | Modelos de MongoDB |
| backend/controllers/ | Validaciones y operaciones |
| backend/routes/ | Rutas de la API |
| backend/pruebas-cursos.http | Peticiones de ejemplo para REST Client |
| frontend-react/src/pages/Cursos.jsx | Coordinación de la pantalla |
| frontend-react/src/components/FormularioCurso.jsx | Alta y edición con MUI |
| frontend-react/src/components/ListaCursos.jsx | Consulta y eliminación con MUI |
| frontend-react/src/services/cursos.js | Peticiones del módulo al backend |

## Verificación

```powershell
cd frontend-react
npm.cmd run build
```

Las peticiones HTTP requieren ejecutar primero el login y utilizar su token. Las escrituras de Cursos requieren rol admin.

## Créditos

Adaptación del proyecto base de Programación IV. Se conserva su licencia MIT y los créditos originales.
