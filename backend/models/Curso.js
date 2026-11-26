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
