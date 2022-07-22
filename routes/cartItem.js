const express = require('express')

const router = express.Router()

const CartItemController = require('../controllers/cartItemController') 

router.get('/get-all', CartItemController.getAll)

module.exports = router