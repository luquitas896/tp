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
