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
