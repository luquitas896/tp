const mongoose = require("mongoose")

const entidadPlantillaSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: "",
        trim: true
    }
}, {
    versionKey: false
})

const EntidadPlantilla = mongoose.model("EntidadPlantilla", entidadPlantillaSchema)

module.exports = EntidadPlantilla
//definimos datos 
