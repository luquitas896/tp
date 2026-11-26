const mongoose = require("mongoose")
//definimos datos
const materiaSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, "El código es obligatorio"],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [1, "El código no puede estar vacío"]
    },
    nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
        minlength: [1, "El nombre no puede estar vacío"],
        maxlength: [100, "El nombre no puede superar los 100 caracteres"]
    },
    descripcion: {
        type: String,
        default: "",
        trim: true,
        validate: {
            validator: valor => valor === "" || valor.trim().length > 0,
            message: "La descripción no puede contener únicamente espacios"
        },
        maxlength: [500, "La descripción no puede superar los 500 caracteres"]
    },
    cargaHoraria: {
        type: Number,
        required: [true, "La carga horaria es obligatoria"],
        validate: {
            validator: Number.isInteger,
            message: "La carga horaria debe ser un número entero"
        },
        min: [1, "La carga horaria debe ser mayor que cero"]
    },
    estado: {
        type: String,
        required: [true, "El estado es obligatorio"],
        lowercase: true,
        trim: true,
        enum: {
            values: ["activa", "inactiva"],
            message: "El estado debe ser activa o inactiva"
        }
    }
}, {
    versionKey: false
})

const Materia = mongoose.model("Materia", materiaSchema)

module.exports = Materia
