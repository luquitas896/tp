const EntidadPlantilla = require("../models/EntidadPlantilla")
//realiza todas las operaciones
async function obtenerEntidades(req, res) {
    const entidades = await EntidadPlantilla.find()
    res.json(entidades)
}

async function obtenerEntidad(req, res) {
    const entidad = await EntidadPlantilla.findOne({ codigo: req.params.codigo })
    if (!entidad) {
        return res.status(404).json({ mensaje: "Registro no encontrado" })
    }
    res.json(entidad)
}

async function crearEntidad(req, res) {
    const { codigo, nombre, descripcion } = req.body
    if (typeof codigo !== "string" || !codigo.trim()) {
        return res.status(400).json({ mensaje: "El código es obligatorio" })
    }
    if (/\s/.test(codigo)) {
        return res.status(400).json({ mensaje: "El código no puede contener espacios" })
    }
    if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({ mensaje: "El nombre es obligatorio" })
    }

    const codigoLimpio = codigo.trim()
    const nombreLimpio = nombre.trim()

    const existe = await EntidadPlantilla.findOne({ codigo: codigoLimpio })
    if (existe) {
        return res.status(409).json({ mensaje: "El código ya existe" })
    }

    const nuevaEntidad = await EntidadPlantilla.create({ codigo: codigoLimpio, nombre: nombreLimpio, descripcion })
    res.status(201).json(nuevaEntidad)
}

async function actualizarEntidad(req, res) {
    const codigoActual = req.params.codigo
    const { codigo, nombre, descripcion } = req.body
    if (typeof codigo !== "string" || !codigo.trim()) {
        return res.status(400).json({ mensaje: "El código es obligatorio" })
    }
    if (/\s/.test(codigo)) {
        return res.status(400).json({ mensaje: "El código no puede contener espacios" })
    }
    if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({ mensaje: "El nombre es obligatorio" })
    }

    const codigoLimpio = codigo.trim()
    const nombreLimpio = nombre.trim()

    const entidad = await EntidadPlantilla.findOne({ codigo: codigoActual })
    if (!entidad) {
        return res.status(404).json({ mensaje: "Registro no encontrado" })
    }

    if (codigoLimpio !== codigoActual) {
        const existe = await EntidadPlantilla.findOne({ codigo: codigoLimpio })
        if (existe) {
            return res.status(409).json({ mensaje: "El código ya existe" })
        }
    }

    entidad.codigo = codigoLimpio
    entidad.nombre = nombreLimpio
    entidad.descripcion = typeof descripcion === "string" ? descripcion.trim() : ""
    await entidad.save()

    res.json(entidad)
}

async function eliminarEntidad(req, res) {
    const entidad = await EntidadPlantilla.findOneAndDelete({ codigo: req.params.codigo })
    if (!entidad) {
        return res.status(404).json({ mensaje: "Registro no encontrado" })
    }
    res.json({ mensaje: "Registro eliminado correctamente" })
}

module.exports = {
    obtenerEntidades,
    obtenerEntidad,
    crearEntidad,
    actualizarEntidad,
    eliminarEntidad
}
