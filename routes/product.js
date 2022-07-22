const express = require("express")
const router = express.Router()

//controller
const ProductController = require("../controllers/productController")
const upload = require("../middlewares/Files")
const { CheckToken } = require("../middlewares/User")
router.get("/get-all-new", ProductController.featuredProduct)
router.get("/get-all", ProductController.getAll)
router.post("/insert",CheckToken, upload.array('files', 20), ProductController.insert)
router.get('/get-detail', ProductController.getDetail)
router.delete('/delete',CheckToken, ProductController.delete)
router.put('/update',CheckToken,upload.array('files', 20), ProductController.update)
router.get('/get-product-checkout-list', ProductController.getCheckoutList)

module.exports = router