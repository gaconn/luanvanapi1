const express = require('express')
const router = express.Router()
const CategoryController = require('../controllers/categoryController')
const { CheckToken } = require('../middlewares/User')

router.get('/get-all', CategoryController.getAll)
router.post('/insert',CheckToken, CategoryController.insert)
router.put('/update',CheckToken, CategoryController.update)
router.delete('/delete/:id',CheckToken, CategoryController.delete)
router.get('/get-detail', CategoryController.getDetail)
router.get('/get-tree', CategoryController.getTree)


module.exports = router