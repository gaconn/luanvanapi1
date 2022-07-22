const express = require('express')
const router = express.Router()
const DiscountController = require('../controllers/discountController')
router.get('/get-list', DiscountController.getList)
router.post('/insert', DiscountController.insert)
router.put('/update', DiscountController.update)
router.delete('/delete', DiscountController.delete)

module.exports = router