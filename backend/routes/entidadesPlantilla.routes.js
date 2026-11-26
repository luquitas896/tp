const express = require("express")
const { verificarToken } = require("../middlewares/authMiddleware")
const { verificarRol } = require("../middlewares/rolMiddleware")
const {
    obtenerEntidades,
    obtenerEntidad,
    crearEntidad,
    actualizarEntidad,
    eliminarEntidad
} = require("../controllers/entidadesPlantilla.controller")

const router = express.Router()

router.get("/", verificarToken, obtenerEntidades)
router.get("/:codigo", verificarToken, obtenerEntidad)
router.post("/", verificarToken, verificarRol("admin"), crearEntidad)
router.put("/:codigo", verificarToken, verificarRol("admin"), actualizarEntidad)
router.delete("/:codigo", verificarToken, verificarRol("admin"), eliminarEntidad)

module.exports = router
//rutas y funcion a ejecutar