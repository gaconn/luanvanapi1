const express = require('express')
const router = express.Router()
const SupplierController = require('../controllers/supplierController')
const { CheckToken } = require('../middlewares/User')

router.get('/get-all', SupplierController.getAll)
router.post('/insert',CheckToken, SupplierController.insert)
router.put('/update',CheckToken, SupplierController.update)
router.delete('/delete/:id',CheckToken, SupplierController.delete)
router.get('/get-detail', SupplierController.getDetail)

module.exports = router