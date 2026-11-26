const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
require("dotenv").config()

const Usuario = require("./models/Usuario")

async function crearUsuario() {
   try {
    await mongoose.connect(process.env.MONGO_URI)
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) throw new Error("Configurá ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env")

    const hash = await bcrypt.hash(password, 10)

    const usuario = new Usuario({
        nombre: "Administrador de prueba",
        email: email,
        password: hash,
        rol: "admin"
    })
    await usuario.save()

    console.log("Usuario de prueba creado correctamente")
    console.log("Email:", email)
   } catch (error) {
    console.error("Error al crear el usuario: ", error.message)
   } finally {
    await mongoose.disconnect()
   }
}

crearUsuario()