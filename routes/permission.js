const express = require("express")
const router = express.Router()
const PermissionController = require("../controllers/permissionController")

    router.get('/get-list', PermissionController.getList)

module.exports = router