const Materia = require("../models/Materia")
//realiza todas las operaciones
function normalizarCodigo(codigo) {
    return typeof codigo === "string" ? codigo.trim().toUpperCase() : ""
}

function validarDatos(datos) {
    const codigo = normalizarCodigo(datos.codigo)
    const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : ""
    const descripcion = datos.descripcion == null ? "" : datos.descripcion
    const estado = typeof datos.estado === "string" ? datos.estado.trim().toLowerCase() : ""

    if (!codigo) return { error: "El código es obligatorio" }
    if (!nombre) return { error: "El nombre es obligatorio" }
    if (typeof descripcion !== "string") return { error: "La descripción debe ser un texto" }
    if (descripcion.length > 0 && !descripcion.trim()) {
        return { error: "La descripción no puede contener únicamente espacios" }
    }
    if (typeof datos.cargaHoraria !== "number" || !Number.isInteger(datos.cargaHoraria) || datos.cargaHoraria <= 0) {
        return { error: "La carga horaria debe ser un número entero mayor que cero" }
    }
    if (!["activa", "inactiva"].includes(estado)) {
        return { error: "El estado debe ser activa o inactiva" }
    }

    return {
        materia: {
            codigo,
            nombre,
            descripcion: descripcion.trim(),
            cargaHoraria: datos.cargaHoraria,
            estado
        }
    }
}

function responderError(res, error) {
    if (error.code === 11000) {
        return res.status(409).json({ mensaje: "Ya existe una materia con ese código" })
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ mensaje: "Los datos de la materia no son válidos" })
    }
    console.error("Error en el módulo Materias:", error)
    return res.status(500).json({ mensaje: "Ocurrió un error al procesar la materia" })
}

async function obtenerMaterias(req, res) {
    try {
        const materias = await Materia.find().sort({ codigo: 1 })
        return res.json(materias)
    } catch (error) {
        return responderError(res, error)
    }
}

async function obtenerMateria(req, res) {
    try {
        const codigo = normalizarCodigo(req.params.codigo)
        const materia = await Materia.findOne({ codigo })
        if (!materia) return res.status(404).json({ mensaje: "Materia no encontrada" })
        return res.json(materia)
    } catch (error) {
        return responderError(res, error)
    }
}

async function crearMateria(req, res) {
    const resultado = validarDatos(req.body || {})
    if (resultado.error) return res.status(400).json({ mensaje: resultado.error })

    try {
        const existe = await Materia.findOne({ codigo: resultado.materia.codigo })
        if (existe) return res.status(409).json({ mensaje: "Ya existe una materia con ese código" })

        const materia = await Materia.create(resultado.materia)
        return res.status(201).json(materia)
    } catch (error) {
        return responderError(res, error)
    }
}

async function actualizarMateria(req, res) {
    const codigoActual = normalizarCodigo(req.params.codigo)
    const datos = { ...(req.body || {}) }
    if (datos.codigo == null || datos.codigo === "") datos.codigo = codigoActual
    const resultado = validarDatos(datos)
    if (resultado.error) return res.status(400).json({ mensaje: resultado.error })

    try {
        const materia = await Materia.findOne({ codigo: codigoActual })
        if (!materia) return res.status(404).json({ mensaje: "Materia no encontrada" })

        if (resultado.materia.codigo !== codigoActual) {
            const codigoEnUso = await Materia.findOne({ codigo: resultado.materia.codigo })
            if (codigoEnUso) return res.status(409).json({ mensaje: "Ya existe otra materia con ese código" })
        }

        Object.assign(materia, resultado.materia)
        await materia.save()
        return res.json(materia)
    } catch (error) {
        return responderError(res, error)
    }
}

async function eliminarMateria(req, res) {
    try {
        const codigo = normalizarCodigo(req.params.codigo)
        const materia = await Materia.findOneAndDelete({ codigo })
        if (!materia) return res.status(404).json({ mensaje: "Materia no encontrada" })
        return res.json({ mensaje: "Materia eliminada correctamente" })
    } catch (error) {
        return responderError(res, error)
    }
}

module.exports = {
    obtenerMaterias,
    obtenerMateria,
    crearMateria,
    actualizarMateria,
    eliminarMateria
}
