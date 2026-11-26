# Módulo Cursos – guía de cambios por archivo

Cada bloque indica **en qué archivo va** y trae el **código completo**. Las rutas son relativas a la raíz del proyecto (`sga-modulo-materias/`).

> No se toca nada de Login, `AuthProvider`, `RutaProtegida`, `LayoutPpal` ni los middlewares de seguridad.


---

## BACKEND


### 1. Modelo
**Archivo:** `backend/models/Curso.js`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```js
const mongoose = require("mongoose")

// Estructura de un curso en MongoDB
const esquemaCurso = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, "El código es obligatorio"],
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
        maxlength: [100, "El nombre no puede superar los 100 caracteres"]
    },
    descripcion: {
        type: String,
        default: "",
        trim: true,
        maxlength: [500, "La descripción no puede superar los 500 caracteres"]
    },
    duracion: {
        type: Number,
        required: [true, "La duración es obligatoria"],
        min: [1, "La duración debe ser mayor que cero"],
        validate: {
            validator: Number.isInteger,
            message: "La duración debe ser un número entero"
        }
    }
}, {
    versionKey: false
})

const Curso = mongoose.model("Curso", esquemaCurso)

module.exports = Curso
```


### 2. Controlador
**Archivo:** `backend/controllers/cursos.controller.js`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```js
const Curso = require("../models/Curso")

// Valida y limpia los datos que llegan en el body.
// Devuelve { error } si algo está mal, o { datos } listos para guardar.
function prepararDatos(body = {}) {
    const codigo = typeof body.codigo === "string" ? body.codigo.trim() : ""
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : ""
    const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() : ""
    const { duracion } = body

    if (!codigo) return { error: "El código es obligatorio" }
    if (/\s/.test(codigo)) return { error: "El código no puede contener espacios" }
    if (!nombre) return { error: "El nombre es obligatorio" }
    if (!Number.isInteger(duracion) || duracion < 1) {
        return { error: "La duración debe ser un número entero mayor que cero" }
    }

    return { datos: { codigo, nombre, descripcion, duracion } }
}

// Traduce los errores de Mongoose / Mongo a respuestas HTTP
function manejarError(res, error) {
    if (error.code === 11000) {
        return res.status(409).json({ mensaje: "Ya existe un curso con ese código" })
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ mensaje: "Los datos del curso no son válidos" })
    }
    console.error("Error en el módulo Cursos:", error)
    return res.status(500).json({ mensaje: "Ocurrió un error al procesar el curso" })
}

// GET /cursos
async function listarCursos(req, res) {
    try {
        const cursos = await Curso.find().sort({ codigo: 1 })
        return res.json(cursos)
    } catch (error) {
        return manejarError(res, error)
    }
}

// GET /cursos/:codigo
async function buscarCursoPorCodigo(req, res) {
    try {
        const curso = await Curso.findOne({ codigo: req.params.codigo.trim() })
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" })
        return res.json(curso)
    } catch (error) {
        return manejarError(res, error)
    }
}

// POST /cursos
async function registrarCurso(req, res) {
    const { error, datos } = prepararDatos(req.body)
    if (error) return res.status(400).json({ mensaje: error })

    try {
        const repetido = await Curso.findOne({ codigo: datos.codigo })
        if (repetido) return res.status(409).json({ mensaje: "Ya existe un curso con ese código" })

        const curso = await Curso.create(datos)
        return res.status(201).json(curso)
    } catch (err) {
        return manejarError(res, err)
    }
}

// PUT /cursos/:codigo
async function modificarCurso(req, res) {
    const codigoOriginal = req.params.codigo.trim()
    // Si el body no trae código, se conserva el de la URL
    const { error, datos } = prepararDatos({
        ...req.body,
        codigo: req.body?.codigo || codigoOriginal
    })
    if (error) return res.status(400).json({ mensaje: error })

    try {
        const curso = await Curso.findOne({ codigo: codigoOriginal })
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" })

        // Si cambia el código, no puede pisar el de otro curso
        if (datos.codigo !== codigoOriginal) {
            const enUso = await Curso.findOne({ codigo: datos.codigo })
            if (enUso) return res.status(409).json({ mensaje: "Ya existe otro curso con ese código" })
        }

        curso.set(datos)
        await curso.save()
        return res.json(curso)
    } catch (err) {
        return manejarError(res, err)
    }
}

// DELETE /cursos/:codigo
async function borrarCurso(req, res) {
    try {
        const curso = await Curso.findOneAndDelete({ codigo: req.params.codigo.trim() })
        if (!curso) return res.status(404).json({ mensaje: "Curso no encontrado" })
        return res.json({ mensaje: "Curso eliminado correctamente" })
    } catch (error) {
        return manejarError(res, error)
    }
}

module.exports = {
    listarCursos,
    buscarCursoPorCodigo,
    registrarCurso,
    modificarCurso,
    borrarCurso
}
```


### 3. Rutas
**Archivo:** `backend/routes/cursos.routes.js`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```js
const express = require("express")
const { verificarToken } = require("../middlewares/authMiddleware")
const { verificarRol } = require("../middlewares/rolMiddleware")
const {
    listarCursos,
    buscarCursoPorCodigo,
    registrarCurso,
    modificarCurso,
    borrarCurso
} = require("../controllers/cursos.controller")

const router = express.Router()

// Consultar: cualquier usuario autenticado
router.get("/", verificarToken, listarCursos)
router.get("/:codigo", verificarToken, buscarCursoPorCodigo)

// Modificar datos: solo administradores
router.post("/", verificarToken, verificarRol("admin"), registrarCurso)
router.put("/:codigo", verificarToken, verificarRol("admin"), modificarCurso)
router.delete("/:codigo", verificarToken, verificarRol("admin"), borrarCurso)

module.exports = router
```


### 4. Registrar las rutas en el servidor
**Archivo:** `backend/server.js`  
**Qué hacer:** REEMPLAZAR el archivo completo. Lo único nuevo son las 2 líneas marcadas con `NUEVO` (el require y el app.use).

```js
require("dotenv").config()

const express = require("express")
const cors = require("cors")

const conectarDB = require("./config/database")
const alumnosRoutes = require("./routes/alumnos.routes")
const docentesRoutes = require("./routes/docentes.routes")
const authRoutes  = require("./routes/authRoutes")
const materiasRoutes = require("./routes/materias.routes")
const cursosRoutes = require("./routes/cursos.routes")   // <-- NUEVO

const app = express()

app.use(express.json())
app.use(cors())
app.use("/alumnos", alumnosRoutes)
app.use("/docentes", docentesRoutes)
app.use("/auth", authRoutes)
app.use("/materias", materiasRoutes)
app.use("/cursos", cursosRoutes)                         // <-- NUEVO

const PORT = process.env.PORT

conectarDB()

console.log("Ejecutado con nodemon")

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`)
})
```


### 5. Pruebas Rest Client
**Archivo:** `backend/pruebas-cursos.http`  
**Qué hacer:** CREAR (o pegar al final de `backend/pruebas.http`). Ejecutá primero el login para obtener el token. El usuario debe ser admin (el que crea `crearUsuario.js` lo es).

```http
### Paso 0: obtener el token (ejecutar primero)
# @name login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
    "email": "{{adminEmail}}",
    "password": "{{adminPassword}}"
}

### Prueba 1: registrar un curso (POST)
POST http://localhost:3000/cursos
Content-Type: application/json
Authorization: Bearer {{login.response.body.token}}

{
    "codigo": "CUR001",
    "nombre": "Programación Web",
    "descripcion": "Desarrollo de aplicaciones web",
    "duracion": 64
}

### Listado de cursos (GET)
GET http://localhost:3000/cursos
Authorization: Bearer {{login.response.body.token}}

### Prueba 2a: consultar un curso por código (GET)
GET http://localhost:3000/cursos/CUR001
Authorization: Bearer {{login.response.body.token}}

### Prueba 2b: modificar el curso (PUT)
PUT http://localhost:3000/cursos/CUR001
Content-Type: application/json
Authorization: Bearer {{login.response.body.token}}

{
    "codigo": "CUR001",
    "nombre": "Programación Web II",
    "descripcion": "Desarrollo de aplicaciones web",
    "duracion": 80
}

### Prueba 3a: eliminar el curso (DELETE)
DELETE http://localhost:3000/cursos/CUR001
Authorization: Bearer {{login.response.body.token}}

### Prueba 3b: verificar que ya no aparece en el listado (GET)
GET http://localhost:3000/cursos
Authorization: Bearer {{login.response.body.token}}

### Extra: consultar el curso eliminado (debe dar 404)
GET http://localhost:3000/cursos/CUR001
Authorization: Bearer {{login.response.body.token}}
```


---

## FRONTEND (React)


### 6. Página
**Archivo:** `frontend-react/src/pages/Cursos.jsx`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```jsx
import { useState } from "react"
import Alert from "@mui/material/Alert"
import FormularioCurso from "../components/FormularioCurso"
import ListaCursos from "../components/ListaCursos"
import { useAuth } from "../context/useAuth"

export default function Cursos() {
    // Cambia cada vez que hay que volver a pedir el listado al backend
    const [version, setVersion] = useState(0)
    // Curso seleccionado con el botón Editar (null = formulario en modo "nuevo")
    const [seleccionado, setSeleccionado] = useState(null)
    const [aviso, setAviso] = useState("")
    const { usuario } = useAuth()
    const puedeEditar = usuario?.rol === "admin"

    // Se ejecuta después de registrar, modificar o eliminar
    function alTerminarOperacion(texto = "") {
        setVersion(v => v + 1)
        setSeleccionado(null)
        setAviso(texto)
    }

    function cancelarEdicion() {
        setAviso("")
        setSeleccionado(null)
    }

    return (
        <>
            {aviso && <Alert severity="success" role="status" sx={{ mb: 3 }}>{aviso}</Alert>}

            {puedeEditar && (
                <FormularioCurso
                    key={seleccionado?.codigo ?? "nuevo"}
                    curso={seleccionado}
                    onGuardado={alTerminarOperacion}
                    onCancelar={cancelarEdicion}
                />
            )}

            <ListaCursos
                version={version}
                onEditar={setSeleccionado}
                onEliminado={alTerminarOperacion}
            />
        </>
    )
}
```


### 7. Formulario (POST y PUT)
**Archivo:** `frontend-react/src/components/FormularioCurso.jsx`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```jsx
import { useState } from "react"
import Alert from "@mui/material/Alert"
import API_URL from "../config/api"
import { useAuth } from "../context/useAuth"
import "./FormularioCurso.css"

const URL_CURSOS = `${API_URL}/cursos`

export default function FormularioCurso({ curso, onGuardado, onCancelar }) {
    const { token } = useAuth()
    const editando = Boolean(curso)

    // Si hay un curso seleccionado, el formulario arranca con sus datos
    const [datos, setDatos] = useState({
        codigo: curso?.codigo ?? "",
        nombre: curso?.nombre ?? "",
        descripcion: curso?.descripcion ?? "",
        duracion: curso?.duracion ?? ""
    })
    const [error, setError] = useState("")
    const [enviando, setEnviando] = useState(false)

    function actualizarCampo(e) {
        const { name, value } = e.target
        // El código no admite espacios
        const nuevoValor = name === "codigo" ? value.replace(/\s/g, "") : value
        setDatos(previo => ({ ...previo, [name]: nuevoValor }))
        setError("")
    }

    function validar() {
        if (!datos.codigo.trim()) return "El código es obligatorio."
        if (!datos.nombre.trim()) return "El nombre es obligatorio."
        const horas = Number(datos.duracion)
        if (!datos.duracion || !Number.isInteger(horas) || horas < 1) {
            return "La duración debe ser un número entero mayor que cero."
        }
        return ""
    }

    async function enviar(e) {
        e.preventDefault()

        const problema = validar()
        if (problema) {
            setError(problema)
            return
        }

        setEnviando(true)
        setError("")

        // POST para crear, PUT (con el código original en la URL) para modificar
        const direccion = editando
            ? `${URL_CURSOS}/${encodeURIComponent(curso.codigo)}`
            : URL_CURSOS

        try {
            const respuesta = await fetch(direccion, {
                method: editando ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    codigo: datos.codigo.trim(),
                    nombre: datos.nombre.trim(),
                    descripcion: datos.descripcion.trim(),
                    duracion: Number(datos.duracion)
                })
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo guardar el curso")

            onGuardado(editando ? "Curso modificado correctamente." : "Curso registrado correctamente.")
        } catch (err) {
            setError(err.message || "No se pudo conectar con el servidor")
        } finally {
            setEnviando(false)
        }
    }

    return (
        <section className="curso-form">
            <h2 className="curso-form__titulo">
                {editando ? `Editar curso ${curso.codigo}` : "Nuevo curso"}
            </h2>

            <form className="curso-form__grilla" onSubmit={enviar} noValidate>
                <label className="curso-form__campo">
                    Código *
                    <input
                        name="codigo"
                        value={datos.codigo}
                        onChange={actualizarCampo}
                        onKeyDown={e => {
                            if (e.key === " ") e.preventDefault()
                        }}
                    />
                </label>

                <label className="curso-form__campo">
                    Nombre *
                    <input name="nombre" value={datos.nombre} onChange={actualizarCampo} />
                </label>

                <label className="curso-form__campo">
                    Descripción
                    <input name="descripcion" value={datos.descripcion} onChange={actualizarCampo} />
                </label>

                <label className="curso-form__campo">
                    Duración (horas) *
                    <input
                        name="duracion"
                        type="number"
                        min="1"
                        step="1"
                        value={datos.duracion}
                        onChange={actualizarCampo}
                    />
                </label>

                <div className="curso-form__botones">
                    <button className="curso-form__btn" type="submit" disabled={enviando}>
                        {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar curso"}
                    </button>
                    {editando && (
                        <button
                            className="curso-form__btn curso-form__btn--secundario"
                            type="button"
                            onClick={onCancelar}
                            disabled={enviando}
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                {error && <Alert severity="error" role="alert" sx={{ gridColumn: "1 / -1" }}>{error}</Alert>}
            </form>
        </section>
    )
}
```


### 8. Listado (GET, Editar, Eliminar)
**Archivo:** `frontend-react/src/components/ListaCursos.jsx`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```jsx
import { useEffect, useState } from "react"
import Alert from "@mui/material/Alert"
import API_URL from "../config/api"
import { useAuth } from "../context/useAuth"
import "./ListaCursos.css"

const URL_CURSOS = `${API_URL}/cursos`

export default function ListaCursos({ version, onEditar, onEliminado }) {
    const { token, usuario } = useAuth()
    const [cursos, setCursos] = useState([])
    const [error, setError] = useState("")

    // GET: se vuelve a ejecutar cada vez que cambia "version" (tras cada operación)
    useEffect(() => {
        async function traerCursos() {
            setError("")
            try {
                const respuesta = await fetch(URL_CURSOS, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const resultado = await respuesta.json()
                if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo cargar el listado")
                setCursos(resultado)
            } catch (err) {
                setError(err.message || "No se pudo conectar con el servidor")
            }
        }
        traerCursos()
    }, [version, token])

    // DELETE
    async function borrar(curso) {
        if (!window.confirm(`¿Eliminar el curso "${curso.nombre}" (${curso.codigo})?`)) return

        try {
            const respuesta = await fetch(`${URL_CURSOS}/${encodeURIComponent(curso.codigo)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            const resultado = await respuesta.json()
            if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo eliminar el curso")
            onEliminado("Curso eliminado correctamente.")
        } catch (err) {
            setError(err.message || "No se pudo conectar con el servidor")
        }
    }

    const esAdmin = usuario?.rol === "admin"

    return (
        <section className="curso-lista">
            <h2 className="curso-lista__titulo">Listado de cursos</h2>

            {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}

            {cursos.length === 0 ? (
                <p>No hay cursos registrados.</p>
            ) : (
                <ul className="curso-lista__items">
                    {cursos.map(curso => (
                        <li className="curso-lista__item" key={curso.codigo}>
                            <strong>{curso.nombre}</strong> ({curso.codigo})
                            {curso.descripcion && <p>{curso.descripcion}</p>}
                            <p>Duración: {curso.duracion} horas</p>

                            {esAdmin && (
                                <div className="curso-lista__botones">
                                    <button type="button" onClick={() => onEditar(curso)}>
                                        Editar
                                    </button>
                                    <button type="button" onClick={() => borrar(curso)}>
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
```


### 9. Estilos del formulario
**Archivo:** `frontend-react/src/components/FormularioCurso.css`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```css
.curso-form {
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid rgba(128, 128, 128, 0.4);
    border-radius: 16px;
    background: rgba(128, 128, 128, 0.08);
}

.curso-form__titulo {
    margin: 0 0 20px;
}

.curso-form__grilla {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    align-items: end;
}

.curso-form__campo {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.curso-form__campo input {
    box-sizing: border-box;
    width: 100%;
    padding: 11px;
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
}

.curso-form__botones {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.curso-form__btn {
    padding: 10px 16px;
    border: 0;
    border-radius: 8px;
    background: #1976d2;
    color: white;
    font: inherit;
    cursor: pointer;
}

.curso-form__btn--secundario {
    border: 1px solid rgba(128, 128, 128, 0.5);
    background: transparent;
    color: inherit;
}

.curso-form__btn:hover {
    filter: brightness(0.9);
}
```


### 10. Estilos del listado
**Archivo:** `frontend-react/src/components/ListaCursos.css`  
**Qué hacer:** CREAR / reemplazar el archivo completo.

```css
.curso-lista {
    margin-top: 24px;
}

.curso-lista__titulo {
    margin-bottom: 16px;
}

.curso-lista__items {
    display: grid;
    gap: 12px;
    list-style: none;
    padding: 0;
}

.curso-lista__item {
    padding: 18px;
    border: 1px solid rgba(128, 128, 128, 0.4);
    border-radius: 12px;
    background: rgba(128, 128, 128, 0.08);
}

.curso-lista__item p {
    margin: 8px 0;
}

.curso-lista__botones {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.curso-lista__botones button {
    padding: 8px 14px;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
}

.curso-lista__botones button:hover {
    filter: brightness(0.9);
}
```


---

## REACT ROUTER


### 11. Ruta de Cursos
**Archivo:** `frontend-react/src/App.jsx`  
**Qué hacer:** REEMPLAZAR el archivo completo. Lo nuevo: el `import Cursos` y la línea `<Route path="cursos" ...>` dentro del `<Route path="/" element={<LayoutPpal />}>`, así la página se muestra en el `<Outlet />` sin crear otro Layout.

```jsx
import Alumnos from "./pages/Alumnos"
import {FAQ} from "./pages/FAQ"
import {Routes, Route, Navigate} from "react-router-dom"
import LayoutPpal from "./layouts/LayoutPpal"
import Inicio from "./pages/Inicio"
import Docentes from "./pages/Docentes"
import Materias from "./pages/Materias"
import Login from "./pages/Login"
import RutaProtegida from "./components/RutaProtegida"
import Cursos from "./pages/Cursos"   // <-- NUEVO


function App()
{

return (
   <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<RutaProtegida />}>
      <Route path="/" element={<LayoutPpal />}>
        <Route index element={<Inicio />} />
        <Route path="alumnos" element={<Alumnos />} />
        <Route path="docentes" element={<Docentes />} />
        <Route path="materias" element={<Materias />} />
        <Route path="cursos" element={<Cursos />} />   {/* <-- NUEVO: se renderiza en el <Outlet /> de LayoutPpal */}
        <Route path="ayuda" element={<FAQ />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  )
}
export default App
```


### 12. Acceso en el menú
**Archivo:** `frontend-react/src/components/Header.jsx`  
**Qué hacer:** NO reemplazar todo. Dentro del `<Stack component="nav" ...>`, después del link de **Materias** y antes del `<IconButton ... to="/ayuda">`, agregar este bloque (la versión completa del archivo está en el zip):

```jsx
<Link
    component={RouterLink}
    to="/cursos"
    color="text.primary"
    underline="none"
    sx={{ px: { xs: 1, sm: 1.5 }, py: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
>
    Cursos
</Link>
```

---

## Cómo explicar las decisiones (para la defensa)
- **Código como identificador en la URL** (`/cursos/CUR001`): lo pide la consigna; por eso el modelo lo define `unique` y el controlador devuelve 409 si ya existe.
- **GET abierto a cualquier usuario autenticado, POST/PUT/DELETE solo `admin`**: igual que Materias, con los middlewares `verificarToken` y `verificarRol` ya existentes.
- **`version` en `Cursos.jsx`**: es un contador que se incrementa tras cada operación; `ListaCursos` lo tiene en el `useEffect`, así se vuelve a pedir el listado (GET) y queda actualizado.
- **`key` en `FormularioCurso`**: al apretar Editar cambia la key y el formulario se reinicia con los datos del curso elegido; al guardar o cancelar vuelve a modo "nuevo".
- **Una sola función `prepararDatos`** valida y limpia (trim, sin espacios en el código, duración entera ≥ 1) y la usan POST y PUT.
- **Cursos dentro del `<Outlet />`**: la ruta es hija de `LayoutPpal` y de `RutaProtegida`, por eso hereda el login y el layout sin cambios.
