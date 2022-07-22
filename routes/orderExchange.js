const express = require('express')
const router = express.Router()
const OrderExchangeController = require('../controllers/orderExchangeController')
router.get('/get-list', OrderExchangeController.getList)
router.post('/insert', OrderExchangeController.insert)
router.put('/update', OrderExchangeController.update)
router.delete('/delete', OrderExchangeController.delete)

module.exports = router
